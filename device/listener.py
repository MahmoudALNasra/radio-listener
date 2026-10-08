"""
Radio keyword listener — cabin mic keyword alerts (Windows / Raspberry Pi).

Usage:
  python download_model.py
  python list_audio_devices.py   # optional: pick USB mic
  python listener.py
"""

from __future__ import annotations

import json
import queue
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import sounddevice as sd
from vosk import KaldiRecognizer, Model, SetLogLevel

from alert import make_alert
from audio_buffer import RingBuffer
from keywords import KeywordMatcher
from notify import make_notifier
from sync import EventQueue, SupabaseSync

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.json"
MODEL_DIR = ROOT / "models" / "vosk-model-small-en-us-0.15"
CLIPS_DIR = ROOT / "clips"
QUEUE_DIR = ROOT / "queue"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        example = ROOT / "config.pi.example.json"
        if not example.exists():
            example = ROOT / "config.example.json"
        CONFIG_PATH.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"Created {CONFIG_PATH} from example — edit device_id / mic if needed.")
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def resolve_input_device(cfg: dict):
    """Return PortAudio device index/name, or None for system default."""
    raw = cfg.get("input_device", None)
    if raw is None or raw == "" or raw == "default":
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str) and raw.isdigit():
        return int(raw)
    return str(raw)


def pick_capture_rate(device, preferred: int = 16000) -> int:
    """Many USB mics only support 44.1/48 kHz — pick a rate PortAudio accepts."""
    candidates: list[int] = []
    try:
        info = sd.query_devices(device, "input")
        default_rate = int(round(float(info.get("default_samplerate") or 48000)))
        candidates.append(default_rate)
    except Exception:
        candidates.append(48000)
    for rate in (preferred, 48000, 44100, 32000, 22050, 16000):
        if rate not in candidates:
            candidates.append(rate)
    for rate in candidates:
        try:
            sd.check_input_settings(
                device=device, channels=1, dtype="int16", samplerate=rate
            )
            return rate
        except Exception:
            continue
    return candidates[0]


def resample_int16_mono(pcm: bytes, src_rate: int, dst_rate: int) -> bytes:
    """Lightweight linear resample for mono int16 PCM."""
    if not pcm or src_rate == dst_rate:
        return pcm
    import numpy as np

    x = np.frombuffer(pcm, dtype=np.int16)
    if x.size == 0:
        return b""
    n_out = max(1, int(round(x.size * dst_rate / src_rate)))
    t_src = np.linspace(0.0, 1.0, num=x.size, endpoint=False)
    t_dst = np.linspace(0.0, 1.0, num=n_out, endpoint=False)
    y = np.interp(t_dst, t_src, x.astype(np.float32))
    return np.clip(y, -32768, 32767).astype(np.int16).tobytes()


def ensure_model() -> Model:
    if not MODEL_DIR.exists():
        print(
            f"Vosk model missing at {MODEL_DIR}\n"
            "Run:  python download_model.py"
        )
        sys.exit(1)
    return Model(str(MODEL_DIR))


def save_and_upload(
    *,
    ring: RingBuffer,
    pre_pcm: bytes,
    post_pcm: bytes,
    hit: dict,
    clips_dir: Path,
    sync: SupabaseSync,
    event_queue: EventQueue,
) -> None:
    pcm = pre_pcm + post_pcm
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    clip_path = clips_dir / f"{ts}_{hit['keyword']}.wav"
    ring.write_wav(str(clip_path), pcm)
    bps = ring.sample_width * ring.channels * ring.sample_rate
    duration = len(pcm) / bps
    print(
        f"Saved clip: {clip_path} "
        f"({duration:.1f}s = {len(pre_pcm)/bps:.1f}s pre + {len(post_pcm)/bps:.1f}s post)"
    )

    event = {
        "keyword": hit["keyword"],
        "transcript": hit["transcript"],
        "triggered_at": hit["triggered_at"],
        "clip_path_local": str(clip_path),
    }

    def _upload() -> None:
        if sync.enabled:
            ok = sync.upload_event(
                keyword=hit["keyword"],
                transcript=hit["transcript"],
                clip_path=clip_path,
                triggered_at=hit["triggered_at"],
            )
            if not ok:
                event_queue.enqueue(event)
                print("Queued for later upload.")
            else:
                print("Uploaded event + clip to Supabase.")
        else:
            event_queue.enqueue(event)

    threading.Thread(target=_upload, daemon=True).start()


def main() -> None:
    SetLogLevel(-1)
    cfg = load_config()
    sample_rate = int(cfg.get("sample_rate", 16000))
    pre = float(cfg.get("pre_roll_sec", 5))
    post = float(cfg.get("post_roll_sec", 5))
    cooldown = float(cfg.get("keyword_cooldown_sec", 8))
    bytes_per_sample = 2  # int16 mono
    post_bytes_needed = int(post * sample_rate * bytes_per_sample)

    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    model = ensure_model()
    recognizer = KaldiRecognizer(model, sample_rate)
    recognizer.SetWords(True)

    matcher = KeywordMatcher(
        keywords=list(cfg.get("keywords", [])),
        cooldown_sec=cooldown,
    )
    alert = make_alert(
        cfg.get("alert_backend", "simulate"),
        pin=int(cfg.get("gpio_pin", 17)),
    )
    # Keep enough history for pre-roll while post-roll collects separately
    ring = RingBuffer(sample_rate=sample_rate, seconds=pre + 2)

    notifier = make_notifier(cfg)
    sync = SupabaseSync(
        url=cfg.get("supabase_url", ""),
        anon_key=cfg.get("supabase_anon_key", ""),
        device_id=cfg.get("device_id", "pi-cabin-1"),
        enabled=bool(cfg.get("sync_enabled", False)),
        notifier=notifier,
    )
    event_queue = EventQueue(QUEUE_DIR)
    input_device = resolve_input_device(cfg)

    if sync.enabled:
        sync.ensure_device(
            name=str(cfg.get("device_name") or cfg.get("device_id")),
            audio_source=str(cfg.get("audio_source", "cabin_mic")),
        )
        remote = sync.fetch_keywords()
        if remote:
            matcher.set_keywords(remote)
            print(f"Loaded {len(remote)} keywords from Supabase.")

    audio_q: queue.Queue[bytes] = queue.Queue()

    def audio_callback(indata, frames, time_info, status):  # noqa: ARG001
        if status:
            print(f"Audio status: {status}", file=sys.stderr)
        audio_q.put(bytes(indata))

    print("=" * 56)
    print("  LISTENER — radio keyword alerts")
    print(f"  device:   {cfg.get('device_name')} ({cfg.get('device_id')})")
    print(f"  keywords: {', '.join(matcher.keywords)}")
    print(f"  alert:    {cfg.get('alert_backend')}")
    print(f"  mic:      {input_device if input_device is not None else 'system default'}")
    print(f"  clip:     {pre:.0f}s before + {post:.0f}s after keyword")
    print(f"  sync:     {'ON' if sync.enabled else 'OFF (local clips only)'}")
    print(f"  ntfy:     {'ON → ' + str(cfg.get('ntfy_topic')) if notifier.enabled else 'OFF'}")
    print("  Speak a keyword into the mic. Ctrl+C to stop.")
    print("=" * 56)

    def sync_loop() -> None:
        while True:
            time.sleep(30)
            if not sync.enabled:
                continue
            sync.touch_device()
            remote = sync.fetch_keywords()
            if remote is not None:
                matcher.set_keywords(remote)
            n = sync.flush_queue(event_queue)
            if n:
                print(f"Flushed {n} queued event(s) to Supabase.")

    threading.Thread(target=sync_loop, daemon=True).start()

    # Post-roll state: collect exact sample count after hit
    pending_hit: dict | None = None
    pre_pcm = b""
    post_pcm = bytearray()

    def start_hit(keyword: str, transcript: str) -> None:
        nonlocal pending_hit, pre_pcm, post_pcm
        if pending_hit is not None:
            return
        pending_hit = {
            "keyword": keyword,
            "transcript": transcript,
            "triggered_at": datetime.now(timezone.utc).isoformat(),
        }
        pre_pcm = ring.snapshot_seconds(pre)
        post_pcm = bytearray()
        print(f"HIT '{keyword}' — recording {post:.0f}s after…")
        # Fire alert without blocking capture
        threading.Thread(
            target=lambda: alert.trigger(keyword, transcript),
            daemon=True,
        ).start()

    capture_rate = pick_capture_rate(input_device, preferred=sample_rate)
    # Larger blocks at 48 kHz so after resample we still feed Vosk ~0.25s chunks
    blocksize = max(1024, int(round(4000 * capture_rate / sample_rate)))
    stream_kwargs = {
        "samplerate": capture_rate,
        "blocksize": blocksize,
        "dtype": "int16",
        "channels": 1,
        "callback": audio_callback,
    }
    if input_device is not None:
        stream_kwargs["device"] = input_device

    if capture_rate != sample_rate:
        print(
            f"  mic rate: {capture_rate} Hz → resampling to {sample_rate} Hz for Vosk"
        )

    with sd.RawInputStream(**stream_kwargs):
        try:
            while True:
                raw = audio_q.get()
                data = resample_int16_mono(raw, capture_rate, sample_rate)
                if not data:
                    continue
                ring.write(data)

                if pending_hit is not None:
                    # Always keep collecting post-roll audio first
                    need = post_bytes_needed - len(post_pcm)
                    if need > 0:
                        post_pcm.extend(data[:need])
                    if len(post_pcm) >= post_bytes_needed:
                        hit = pending_hit
                        pending_hit = None
                        save_and_upload(
                            ring=ring,
                            pre_pcm=pre_pcm,
                            post_pcm=bytes(post_pcm),
                            hit=hit,
                            clips_dir=CLIPS_DIR,
                            sync=sync,
                            event_queue=event_queue,
                        )
                        pre_pcm = b""
                        post_pcm = bytearray()
                    # Still feed recognizer during post-roll (don't match again)
                    recognizer.AcceptWaveform(data)
                    continue

                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    text = (result.get("text") or "").strip()
                    if text:
                        print(f"Heard: {text}")
                        kw = matcher.match(text)
                        if kw:
                            start_hit(kw, text)
                else:
                    partial = json.loads(recognizer.PartialResult()).get(
                        "partial", ""
                    )
                    if partial:
                        sys.stdout.write(f"\r… {partial[:60]:<60}")
                        sys.stdout.flush()
                        # Catch keyword as soon as it appears mid-utterance
                        # so "after" includes the rest of the sentence
                        kw = matcher.match(partial)
                        if kw:
                            start_hit(kw, partial)
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
