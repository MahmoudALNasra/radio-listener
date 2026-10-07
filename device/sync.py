"""Optional Supabase sync: events + clip upload with local offline queue."""

from __future__ import annotations

import json
import time
import uuid
from pathlib import Path
from typing import Any


class EventQueue:
    def __init__(self, queue_dir: Path) -> None:
        self.queue_dir = queue_dir
        self.queue_dir.mkdir(parents=True, exist_ok=True)

    def enqueue(self, event: dict[str, Any]) -> Path:
        name = f"{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}.json"
        path = self.queue_dir / name
        path.write_text(json.dumps(event, indent=2), encoding="utf-8")
        return path

    def pending(self) -> list[Path]:
        return sorted(self.queue_dir.glob("*.json"))


class SupabaseSync:
    def __init__(
        self,
        url: str,
        anon_key: str,
        device_id: str,
        enabled: bool = False,
    ) -> None:
        self.url = (url or "").strip()
        self.anon_key = (anon_key or "").strip()
        self.device_id = device_id
        self.enabled = bool(enabled and self.url and self.anon_key)
        self._client = None
        if self.enabled:
            from supabase import create_client

            self._client = create_client(self.url, self.anon_key)

    def fetch_keywords(self) -> list[str] | None:
        if not self._client:
            return None
        try:
            res = (
                self._client.table("keywords")
                .select("text")
                .eq("active", True)
                .execute()
            )
            return [row["text"] for row in (res.data or [])]
        except Exception as exc:
            print(f"Keyword sync failed: {exc}")
            return None

    def upload_event(
        self,
        *,
        keyword: str,
        transcript: str,
        clip_path: Path,
        triggered_at: str,
    ) -> bool:
        if not self._client:
            return False
        try:
            storage_path = f"{self.device_id}/{clip_path.name}"
            data = clip_path.read_bytes()
            self._client.storage.from_("clips").upload(
                storage_path,
                data,
                file_options={"content-type": "audio/wav", "upsert": "true"},
            )
            self._client.table("events").insert(
                {
                    "device_id": self.device_id,
                    "keyword": keyword,
                    "transcript": transcript,
                    "clip_path": storage_path,
                    "triggered_at": triggered_at,
                }
            ).execute()
            return True
        except Exception as exc:
            print(f"Upload failed: {exc}")
            return False

    def flush_queue(self, queue: EventQueue) -> int:
        if not self._client:
            return 0
        sent = 0
        for path in queue.pending():
            try:
                event = json.loads(path.read_text(encoding="utf-8"))
                clip = Path(event["clip_path_local"])
                ok = self.upload_event(
                    keyword=event["keyword"],
                    transcript=event["transcript"],
                    clip_path=clip,
                    triggered_at=event["triggered_at"],
                )
                if ok:
                    path.unlink(missing_ok=True)
                    sent += 1
            except Exception as exc:
                print(f"Queue item failed ({path.name}): {exc}")
        return sent
