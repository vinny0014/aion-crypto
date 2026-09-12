import os
import time

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db

router = APIRouter(tags=["health"])
_started_at = time.time()


def _release_metadata() -> dict[str, str | None]:
    candidates = (
        ("AION_RELEASE_SHA", os.getenv("AION_RELEASE_SHA")),
        ("RENDER_GIT_COMMIT", os.getenv("RENDER_GIT_COMMIT")),
        ("GITHUB_SHA", os.getenv("GITHUB_SHA")),
        ("SOURCE_VERSION", os.getenv("SOURCE_VERSION")),
    )
    for source, value in candidates:
        normalized = (value or "").strip().lower()
        if 7 <= len(normalized) <= 40 and all(char in "0123456789abcdef" for char in normalized):
            return {
                "release_sha": normalized,
                "release_short_sha": normalized[:12],
                "release_source": source,
            }
    return {
        "release_sha": None,
        "release_short_sha": None,
        "release_source": None,
    }


@router.get("/health")
async def health(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "app": get_settings().app_name,
        "env": get_settings().app_env,
        "database": "ok" if db_ok else "error",
        "uptime_seconds": round(time.time() - _started_at, 1),
        **_release_metadata(),
    }


@router.get("/health/live")
async def live():
    return {"status": "ok", "app": get_settings().app_name}


@router.get("/health/ready")
async def ready(response: Response, db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready", "database": "error", **_release_metadata()}
    return {
        "status": "ready",
        "database": "ok",
        "coordination_dispatch_retry": True,
        **_release_metadata(),
    }
