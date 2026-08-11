"""Protected scheduler triggers for GitHub Actions and recovery runs."""
from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.services.scheduler import run_editorial_schedule

router = APIRouter(prefix="/internal/scheduler", tags=["internal"])


def _authorize(token: str | None) -> None:
    configured = get_settings().scheduler_token
    if not configured or token is None or not secrets.compare_digest(token, configured):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid scheduler token")


@router.post("/run")
def run_schedule(x_scheduler_token: str | None = Header(default=None), db: Session = Depends(get_db)):
    _authorize(x_scheduler_token)
    return run_editorial_schedule(db)


@router.post("/run-manual")
def run_manual_schedule(x_scheduler_token: str | None = Header(default=None), db: Session = Depends(get_db)):
    _authorize(x_scheduler_token)
    return run_editorial_schedule(db, trigger="manual")
