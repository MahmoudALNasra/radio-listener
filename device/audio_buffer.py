"""Rolling PCM ring buffer for ±N second clips."""

from __future__ import annotations

import io
import threading
import wave
from collections import deque


class RingBuffer:
    def __init__(self, sample_rate: int, channels: int = 1, seconds: float = 12.0) -> None:
        self.sample_rate = sample_rate
        self.channels = channels
        self.max_samples = int(sample_rate * seconds)
        self._buf: deque[bytes] = deque()
        self._samples = 0
        self._lock = threading.Lock()
        self.sample_width = 2  # int16

    def write(self, pcm16: bytes) -> None:
        if not pcm16:
            return
        n = len(pcm16) // (self.sample_width * self.channels)
        with self._lock:
            self._buf.append(pcm16)
            self._samples += n
            while self._samples > self.max_samples and self._buf:
                old = self._buf.popleft()
                self._samples -= len(old) // (self.sample_width * self.channels)

    def snapshot_seconds(self, seconds: float) -> bytes:
        need = int(self.sample_rate * seconds)
        with self._lock:
            chunks = list(self._buf)
            total = self._samples
        if total <= need:
            return b"".join(chunks)
        # Keep the last `need` samples
        keep: list[bytes] = []
        counted = 0
        for chunk in reversed(chunks):
            keep.append(chunk)
            counted += len(chunk) // (self.sample_width * self.channels)
            if counted >= need:
                break
        keep.reverse()
        data = b"".join(keep)
        max_bytes = need * self.sample_width * self.channels
        if len(data) > max_bytes:
            data = data[-max_bytes:]
        return data

    def write_wav(self, path: str, pcm: bytes) -> None:
        with wave.open(path, "wb") as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.sample_width)
            wf.setframerate(self.sample_rate)
            wf.writeframes(pcm)

    def wav_bytes(self, pcm: bytes) -> bytes:
        bio = io.BytesIO()
        with wave.open(bio, "wb") as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.sample_width)
            wf.setframerate(self.sample_rate)
            wf.writeframes(pcm)
        return bio.getvalue()
