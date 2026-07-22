"""In-memory TTL cache + persisted last-valid-value store.

Guarantees the product rule: never show invented data. When live sources
fail we serve the last real value, explicitly flagged as stale, or an
explicit "unavailable" status — never zeros or fabrications.
"""
from __future__ import annotations

import json
import os
import threading
import time
from typing import Any, Optional


class TTLCache:
    def __init__(self) -> None:
        self._data: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._data.get(key)
            if not item:
                return None
            expires_at, value = item
            if time.time() > expires_at:
                del self._data[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        with self._lock:
            self._data[key] = (time.time() + ttl_seconds, value)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()


class LastValidStore:
    """Persists the last successfully fetched real value per key."""

    def __init__(self, path: str) -> None:
        self.path = path
        self._lock = threading.Lock()

    def _read_all(self) -> dict[str, Any]:
        if not os.path.exists(self.path):
            return {}
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}

    def save(self, key: str, value: Any) -> None:
        with self._lock:
            data = self._read_all()
            data[key] = {"saved_at": time.time(), "value": value}
            os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
            tmp = self.path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f)
            os.replace(tmp, self.path)

    def load(self, key: str) -> Optional[dict[str, Any]]:
        with self._lock:
            return self._read_all().get(key)
