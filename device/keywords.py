"""Keyword matching helpers."""

from __future__ import annotations

import re
import time
from dataclasses import dataclass, field


@dataclass
class KeywordMatcher:
    keywords: list[str] = field(default_factory=list)
    cooldown_sec: float = 8.0
    _last_hit: dict[str, float] = field(default_factory=dict)

    def set_keywords(self, keywords: list[str]) -> None:
        self.keywords = [k.strip().lower() for k in keywords if k.strip()]

    def match(self, text: str) -> str | None:
        if not text:
            return None
        normalized = text.lower()
        now = time.time()
        for kw in self.keywords:
            # word-boundary-ish match so "crash" hits inside "crash on i-10"
            pattern = r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z0-9])"
            if re.search(pattern, normalized):
                last = self._last_hit.get(kw, 0.0)
                if now - last < self.cooldown_sec:
                    continue
                self._last_hit[kw] = now
                return kw
        return None
