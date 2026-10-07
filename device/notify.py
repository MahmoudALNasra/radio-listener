"""Send free push notifications via ntfy.sh (iPhone app supported)."""

from __future__ import annotations

from typing import Any


class NtfyNotifier:
    def __init__(
        self,
        *,
        topic: str,
        server: str = "https://ntfy.sh",
        enabled: bool = False,
    ) -> None:
        self.topic = (topic or "").strip()
        self.server = (server or "https://ntfy.sh").rstrip("/")
        self.enabled = bool(enabled and self.topic)

    def send_event(
        self,
        *,
        keyword: str,
        transcript: str,
        device_id: str,
        triggered_at: str | None = None,
    ) -> bool:
        if not self.enabled:
            return False
        title = f"Listener: {keyword}"
        lines = [f"Device: {device_id}"]
        if transcript:
            lines.append(transcript)
        if triggered_at:
            lines.append(triggered_at)
        message = "\n".join(lines)
        url = f"{self.server}/{self.topic}"
        try:
            import httpx

            response = httpx.post(
                url,
                content=message.encode("utf-8"),
                headers={
                    "Title": title,
                    "Priority": "5",
                    "Tags": "rotating_light,warning",
                    "Content-Type": "text/plain; charset=utf-8",
                },
                timeout=15.0,
            )
            response.raise_for_status()
            print(f"ntfy sent → {self.topic}")
            return True
        except Exception as exc:
            print(f"ntfy failed: {exc}")
            return False


def make_notifier(cfg: dict[str, Any]) -> NtfyNotifier:
    return NtfyNotifier(
        topic=str(cfg.get("ntfy_topic", "")),
        server=str(cfg.get("ntfy_server", "https://ntfy.sh")),
        enabled=bool(cfg.get("ntfy_enabled", False)),
    )
