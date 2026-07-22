import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db

router = APIRouter(tags=["health"])
_started_at = time.time()


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
    }
