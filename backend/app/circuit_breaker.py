"""Thread-safe circuit breaker for upstream market data providers."""
from __future__ import annotations

import threading
import time


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_seconds: int = 30) -> None:
        self.failure_threshold = max(1, failure_threshold)
        self.recovery_seconds = max(1, recovery_seconds)
        self.failures = 0
        self.opened_at: float | None = None
        self._lock = threading.Lock()

    def allow_request(self) -> bool:
        with self._lock:
            if self.opened_at is None:
                return True
            return time.monotonic() - self.opened_at >= self.recovery_seconds

    def record_success(self) -> None:
        with self._lock:
            self.failures = 0
            self.opened_at = None

    def record_failure(self) -> None:
        with self._lock:
            self.failures += 1
            if self.failures >= self.failure_threshold:
                self.opened_at = time.monotonic()

    @property
    def state(self) -> str:
        return "open" if self.opened_at is not None and not self.allow_request() else "closed"
