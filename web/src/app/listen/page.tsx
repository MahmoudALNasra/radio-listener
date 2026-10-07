"use client";

import { InstallBanner } from "@/components/InstallBanner";
import {
  ensurePhoneDevice,
  getPhoneDeviceId,
  getPhoneDeviceName,
  uploadPhoneEvent,
} from "@/lib/phone-device";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Navigator {
    audioSession?: { type: string };
  }
}

function pickRecorderMime(): string {
  const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "";
}

function explainMicError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err);
  if (name === "NotAllowedError" || /permission|denied/i.test(msg)) {
    return "Allow Microphone in Settings → Safari, then try again.";
  }
  if (/Failed to start the audio device|NotReadableError|AbortError/i.test(msg + name)) {
    return "Mic busy. Close Voice Memos / Phone / other tabs, then retry.";
  }
  return msg || "Could not start microphone.";
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ss = s % 60;
  if (h > 0) {
    return `${h}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  }
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M17 11a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-3.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0z" />
    </svg>
  );
}

/** Near-silent loop keeps iOS from fully suspending media while the screen is still on. */
function startKeepAliveAudio(): { stop: () => void } {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return { stop: () => undefined };

  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  // Extremely quiet — enough to keep the audio session alive
  gain.gain.value = 0.001;
  osc.frequency.value = 20;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  void ctx.resume();

  return {
    stop: () => {
      try {
        osc.stop();
        void ctx.close();
      } catch {
        /* ignore */
      }
    },
  };
}

export default function ListenPage() {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState("0:00");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState(
    "Tap the mic to start. Keep the screen on — iPhone stops the mic when locked."
  );
  const [deviceLabel, setDeviceLabel] = useState("");
  const [standalone, setStandalone] = useState(false);
  const [pausedBySystem, setPausedBySystem] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingRef = useRef(false);
  const stoppingRef = useRef(false);
  const startedAtRef = useRef(0);
  const mimeRef = useRef("");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const keepAliveRef = useRef<{ stop: () => void } | null>(null);
  const resumeBusyRef = useRef(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setStandalone(
      nav.standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches
    );
    setDeviceLabel(`${getPhoneDeviceName()} (${getPhoneDeviceId()})`);
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      setElapsed(formatElapsed(Date.now() - startedAtRef.current));
    }, 250);
    return () => clearInterval(id);
  }, [recording]);

  const requestWakeLock = useCallback(async () => {
    try {
      wakeLockRef.current =
        (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      /* optional — user can set Auto-Lock to Never */
    }
  }, []);

  const attachRecorder = useCallback((stream: MediaStream) => {
    const mime = mimeRef.current || pickRecorderMime();
    mimeRef.current = mime;
    const recorder = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (!recordingRef.current || stoppingRef.current) return;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = window.setTimeout(() => {
        if (!recordingRef.current || stoppingRef.current) return;
        const s = streamRef.current;
        if (!s || s.getTracks().every((t) => t.readyState === "ended")) return;
        try {
          attachRecorder(s);
          setPausedBySystem(false);
          setHint("Recording… keep the screen on.");
          setError(null);
        } catch (e) {
          setError(explainMicError(e));
        }
      }, 250);
    };

    recorder.start(1000);
  }, []);

  const ensureLiveStream = useCallback(async (): Promise<MediaStream | null> => {
    const existing = streamRef.current;
    const live =
      existing && existing.getAudioTracks().some((t) => t.readyState === "live");
    if (live && existing) return existing;

    existing?.getTracks().forEach((t) => t.stop());
    if (navigator.audioSession) {
      try {
        navigator.audioSession.type = "play-and-record";
      } catch {
        /* ignore */
      }
    }
    const next = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    streamRef.current = next;
    next.getAudioTracks().forEach((track) => {
      track.onended = () => {
        if (!recordingRef.current || stoppingRef.current) return;
        setPausedBySystem(true);
        setHint("Mic paused (screen lock / leave app). Open Listener again to continue.");
      };
    });
    return next;
  }, []);

  /** After lock / minimize, iOS kills the mic — restart capture when user returns. */
  const resumeCapture = useCallback(async () => {
    if (!recordingRef.current || stoppingRef.current || resumeBusyRef.current) {
      return;
    }
    resumeBusyRef.current = true;
    try {
      if (navigator.audioSession) {
        try {
          navigator.audioSession.type = "play-and-record";
        } catch {
          /* ignore */
        }
      }
      keepAliveRef.current?.stop();
      keepAliveRef.current = startKeepAliveAudio();
      await requestWakeLock();

      const stream = await ensureLiveStream();
      if (!stream || !recordingRef.current) return;

      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") {
        attachRecorder(stream);
      } else if (rec.state === "paused") {
        try {
          rec.resume();
        } catch {
          attachRecorder(stream);
        }
      }

      setPausedBySystem(false);
      setError(null);
      setHint("Recording… keep the screen on (Auto-Lock → Never).");
    } catch (e) {
      setPausedBySystem(true);
      setError(explainMicError(e));
      setHint("Tap here or the mic to resume after unlocking.");
    } finally {
      resumeBusyRef.current = false;
    }
  }, [attachRecorder, ensureLiveStream, requestWakeLock]);

  const finalizeAndUpload = useCallback(async (reason: string) => {
    const recorder = recorderRef.current;
    if (!recorder && chunksRef.current.length === 0) return;

    setUploading(true);
    setHint("Saving…");
    setPausedBySystem(false);

    keepAliveRef.current?.stop();
    keepAliveRef.current = null;

    const blob: Blob = await new Promise((resolve) => {
      if (!recorder || recorder.state === "inactive") {
        resolve(
          new Blob(chunksRef.current, { type: mimeRef.current || "audio/mp4" })
        );
        return;
      }
      recorder.onstop = () => {
        resolve(
          new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/mp4",
          })
        );
      };
      try {
        if (recorder.state === "recording") recorder.requestData();
        recorder.stop();
      } catch {
        resolve(
          new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/mp4",
          })
        );
      }
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    const size = blob.size;
    chunksRef.current = [];

    try {
      await wakeLockRef.current?.release();
    } catch {
      /* ignore */
    }
    wakeLockRef.current = null;

    if (size < 1000) {
      setHint("Too short — nothing saved.");
      setUploading(false);
      return;
    }

    try {
      await ensurePhoneDevice();
      const secs = Math.round((Date.now() - startedAtRef.current) / 1000);
      await uploadPhoneEvent({
        deviceId: getPhoneDeviceId(),
        keyword: "session",
        transcript: `Full session (~${secs}s) — ${reason}`,
        blob,
      });
      setHint("Saved. Tap the mic to record again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setHint("Upload failed.");
    } finally {
      setUploading(false);
      if (navigator.audioSession) {
        try {
          navigator.audioSession.type = "auto";
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  const stopRecording = useCallback(
    async (reason: string) => {
      if (stoppingRef.current) return;
      stoppingRef.current = true;
      recordingRef.current = false;
      setRecording(false);
      await finalizeAndUpload(reason);
      stoppingRef.current = false;
    },
    [finalizeAndUpload]
  );

  const startRecording = useCallback(async () => {
    if (recordingRef.current || uploading) return;
    setError(null);
    setPausedBySystem(false);
    stoppingRef.current = false;

    if (
      typeof navigator.mediaDevices?.getUserMedia !== "function" ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Recording not supported here. Use Safari on iPhone.");
      return;
    }

    try {
      await ensurePhoneDevice();
      if (navigator.audioSession) {
        navigator.audioSession.type = "play-and-record";
      }

      keepAliveRef.current?.stop();
      keepAliveRef.current = startKeepAliveAudio();

      const stream = await ensureLiveStream();
      if (!stream) throw new Error("No microphone stream");

      chunksRef.current = [];
      mimeRef.current = pickRecorderMime();
      attachRecorder(stream);
      await requestWakeLock();

      startedAtRef.current = Date.now();
      recordingRef.current = true;
      setRecording(true);
      setElapsed("0:00");
      setHint("Recording… leave this screen open. Auto-Lock → Never.");
    } catch (e) {
      keepAliveRef.current?.stop();
      keepAliveRef.current = null;
      setError(explainMicError(e));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      recordingRef.current = false;
      setRecording(false);
    }
  }, [attachRecorder, ensureLiveStream, requestWakeLock, uploading]);

  // Resume when returning from lock / another app — do NOT stop on hide
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") {
        if (recordingRef.current) {
          setPausedBySystem(true);
          setHint("Mic paused while away. Re-open Listener to continue.");
          try {
            recorderRef.current?.requestData();
          } catch {
            /* ignore */
          }
        }
        return;
      }
      if (!recordingRef.current || stoppingRef.current) return;
      void resumeCapture();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [resumeCapture]);

  // Best-effort flush only — do not treat minimize as "stop"
  useEffect(() => {
    const flushChunks = () => {
      if (!recordingRef.current) return;
      try {
        recorderRef.current?.requestData();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pagehide", flushChunks);
    window.addEventListener("freeze", flushChunks);
    return () => {
      window.removeEventListener("pagehide", flushChunks);
      window.removeEventListener("freeze", flushChunks);
    };
  }, []);

  useEffect(() => {
    return () => {
      keepAliveRef.current?.stop();
    };
  }, []);

  return (
    <div
      className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center"
      onPointerDown={() => {
        if (recordingRef.current && pausedBySystem) void resumeCapture();
      }}
    >
      {!standalone && (
        <div className="mb-6 w-full space-y-4">
          <InstallBanner />
        </div>
      )}

      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
        Listener
      </p>

      <button
        type="button"
        disabled={uploading}
        onClick={() => {
          if (recording) {
            if (pausedBySystem) {
              void resumeCapture();
              return;
            }
            void stopRecording("stopped by user");
          } else {
            void startRecording();
          }
        }}
        className={[
          "relative flex h-44 w-44 items-center justify-center rounded-full transition",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/40",
          recording
            ? pausedBySystem
              ? "bg-amber-600 shadow-[0_0_0_12px_rgba(217,119,6,0.25)]"
              : "bg-red-600 shadow-[0_0_0_12px_rgba(220,38,38,0.25)]"
            : "bg-sky-600 shadow-[0_0_0_12px_rgba(2,132,199,0.2)] active:scale-95",
          uploading ? "opacity-60" : "",
        ].join(" ")}
        aria-label={
          recording
            ? pausedBySystem
              ? "Resume recording"
              : "Stop recording"
            : "Start recording"
        }
      >
        {recording && !pausedBySystem && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
        )}
        <MicIcon className="relative h-20 w-20 text-white" />
      </button>

      <div className="mt-8 text-center">
        {recording ? (
          <>
            <div
              className={[
                "flex items-center justify-center gap-2",
                pausedBySystem ? "text-amber-400" : "text-red-400",
              ].join(" ")}
            >
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  pausedBySystem
                    ? "bg-amber-500"
                    : "animate-pulse bg-red-500",
                ].join(" ")}
              />
              <span className="text-sm font-semibold uppercase tracking-wider">
                {pausedBySystem ? "Paused — tap to resume" : "Recording"}
              </span>
            </div>
            <div className="mt-2 font-mono text-5xl font-semibold tabular-nums text-white">
              {elapsed}
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              iPhone turns the mic off when the screen locks or you leave the
              app. Keep this screen open (Settings → Display → Auto-Lock →
              Never), or tap the mic when you come back.
            </p>
          </>
        ) : (
          <>
            <div className="text-xl font-semibold text-white">
              {uploading ? "Saving…" : "Tap mic to record"}
            </div>
            <p className="mt-2 text-sm text-zinc-400">{hint}</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-6 max-w-sm text-center text-sm text-red-400">{error}</p>
      )}

      <p className="mt-auto pt-10 text-center text-[11px] text-zinc-600">
        {deviceLabel}
        {standalone ? " · Home Screen app" : ""}
      </p>
    </div>
  );
}
