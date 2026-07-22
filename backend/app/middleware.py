"""Small process-local safety middleware.

The application-level limiter protects one worker. Production should also
enforce limits at Render/Hostinger's edge so multiple workers share a ceiling.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, public_limit: int = 120, auth_limit: int = 10) -> None:
        super().__init__(app)
        self.public_limit = max(1, public_limit)
        self.auth_limit = max(1, auth_limit)
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _group(self, path: str) -> tuple[str, int] | None:
        if path.startswith("/health"):
            return None
        if path in {"/api/v1/auth/login", "/api/v1/auth/refresh"}:
            return "auth", self.auth_limit
        if path.startswith("/api/"):
            return "api", self.public_limit
        return None

    async def dispatch(self, request: Request, call_next):
        group = self._group(request.url.path)
        if group is None:
            return await call_next(request)

        bucket_name, limit = group
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{bucket_name}"
        now = time.monotonic()
        cutoff = now - 60

        with self._lock:
            bucket = self._requests[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                retry_after = max(1, int(60 - (now - bucket[0])))
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded"},
                    headers={"Retry-After": str(retry_after)},
                )
            bucket.append(now)

        return await call_next(request)
