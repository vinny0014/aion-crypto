"""Lease-based coordinator shared by Codex and Manus."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import AgentCoordinationEvent, AgentCoordinationTask

ACTORS = {"codex", "manus"}
EXTERNAL_BLOCKERS = {"payment", "captcha", "login", "2fa", "business_decision"}
DEFAULT_LEASE_SECONDS = 900


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def other_actor(actor: str) -> str:
    return "manus" if actor == "codex" else "codex"


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def record(db: Session, task_id: int, actor: str, event_type: str, detail: str = "") -> None:
    db.add(AgentCoordinationEvent(
        task_id=task_id,
        actor=actor[:20],
        event_type=event_type[:40],
        detail=detail[:10_000],
    ))


def serialize_task(task: AgentCoordinationTask, *, include_instructions: bool = True) -> dict:
    result = {
        "id": task.id,
        "idempotency_key": task.idempotency_key,
        "title": task.title,
        "status": task.status,
        "current_actor": task.current_actor,
        "attempts": task.attempts,
        "max_attempts": task.max_attempts,
        "lease_expires_at": task.lease_expires_at,
        "heartbeat_at": task.heartbeat_at,
        "blocker_type": task.blocker_type,
        "blocker_detail": task.blocker_detail,
        "result_summary": task.result_summary,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at,
    }
    if include_instructions:
        result["instructions"] = task.instructions
    return result


def recover_expired(db: Session) -> int:
    expired = (
        db.query(AgentCoordinationTask)
        .filter(
            AgentCoordinationTask.status == "running",
            AgentCoordinationTask.lease_expires_at < now_utc(),
        )
        .with_for_update(skip_locked=True)
        .all()
    )
    for task in expired:
        previous = task.current_actor
        task.lease_token_hash = ""
        task.lease_expires_at = None
        task.heartbeat_at = None
        task.attempts += 1
        if task.attempts >= task.max_attempts:
            task.status = "failed"
            task.blocker_type = "retry_limit"
            task.blocker_detail = "coordination lease expired too many times"
            record(db, task.id, "system", "failed", task.blocker_detail)
        else:
            task.status = "queued"
            task.current_actor = other_actor(previous)
            task.blocker_type = ""
            task.blocker_detail = ""
            record(db, task.id, "system", "lease_recovered", f"{previous} -> {task.current_actor}")
    if expired:
        db.commit()
    return len(expired)


def create_task(
    db: Session,
    *,
    idempotency_key: str,
    title: str,
    instructions: str,
    actor: str,
    max_attempts: int,
) -> tuple[AgentCoordinationTask, bool]:
    existing = db.query(AgentCoordinationTask).filter_by(idempotency_key=idempotency_key).first()
    if existing:
        return existing, False
    task = AgentCoordinationTask(
        idempotency_key=idempotency_key,
        title=title,
        instructions=instructions,
        current_actor=actor,
        max_attempts=max_attempts,
    )
    db.add(task)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        existing = db.query(AgentCoordinationTask).filter_by(idempotency_key=idempotency_key).one()
        return existing, False
    record(db, task.id, "system", "created", f"assigned to {actor}")
    db.commit()
    db.refresh(task)
    return task, True


def _claim(db: Session, task: AgentCoordinationTask, actor: str, lease_seconds: int) -> tuple[AgentCoordinationTask, str]:
    raw_token = secrets.token_urlsafe(32)
    current = now_utc()
    task.status = "running"
    task.current_actor = actor
    task.lease_token_hash = token_hash(raw_token)
    task.heartbeat_at = current
    task.lease_expires_at = current + timedelta(seconds=lease_seconds)
    record(db, task.id, actor, "claimed", f"lease_seconds={lease_seconds}")
    db.commit()
    db.refresh(task)
    return task, raw_token


def claim_next(db: Session, *, actor: str, lease_seconds: int = DEFAULT_LEASE_SECONDS):
    recover_expired(db)
    task = (
        db.query(AgentCoordinationTask)
        .filter_by(status="queued", current_actor=actor)
        .order_by(AgentCoordinationTask.created_at, AgentCoordinationTask.id)
        .with_for_update(skip_locked=True)
        .first()
    )
    return _claim(db, task, actor, lease_seconds) if task else (None, None)


def claim_task(db: Session, *, task_id: int, actor: str, lease_seconds: int = DEFAULT_LEASE_SECONDS):
    recover_expired(db)
    task = db.query(AgentCoordinationTask).filter_by(id=task_id).with_for_update().first()
    if not task:
        raise HTTPException(status_code=404, detail="coordination task not found")
    if task.status != "queued" or task.current_actor != actor:
        raise HTTPException(status_code=409, detail="coordination task is not claimable by this actor")
    return _claim(db, task, actor, lease_seconds)


def require_lease(db: Session, *, task_id: int, actor: str, lease_token: str) -> AgentCoordinationTask:
    task = db.query(AgentCoordinationTask).filter_by(id=task_id).with_for_update().first()
    if not task:
        raise HTTPException(status_code=404, detail="coordination task not found")
    if (
        task.status != "running"
        or task.current_actor != actor
        or not task.lease_token_hash
        or not secrets.compare_digest(task.lease_token_hash, token_hash(lease_token))
        or task.lease_expires_at is None
        or task.lease_expires_at.replace(tzinfo=task.lease_expires_at.tzinfo or timezone.utc) < now_utc()
    ):
        raise HTTPException(status_code=409, detail="invalid or expired coordination lease")
    return task


def heartbeat(db: Session, *, task_id: int, actor: str, lease_token: str, lease_seconds: int):
    task = require_lease(db, task_id=task_id, actor=actor, lease_token=lease_token)
    current = now_utc()
    task.heartbeat_at = current
    task.lease_expires_at = current + timedelta(seconds=lease_seconds)
    record(db, task.id, actor, "heartbeat")
    db.commit()
    db.refresh(task)
    return task


def handoff(db: Session, *, task_id: int, actor: str, lease_token: str, next_actor: str, detail: str):
    task = require_lease(db, task_id=task_id, actor=actor, lease_token=lease_token)
    task.status = "queued"
    task.current_actor = next_actor
    task.lease_token_hash = ""
    task.lease_expires_at = None
    task.heartbeat_at = None
    task.blocker_type = ""
    task.blocker_detail = ""
    record(db, task.id, actor, "handoff", f"to {next_actor}: {detail}")
    db.commit()
    db.refresh(task)
    return task


def complete(db: Session, *, task_id: int, actor: str, lease_token: str, summary: str):
    task = require_lease(db, task_id=task_id, actor=actor, lease_token=lease_token)
    task.status = "completed"
    task.result_summary = summary
    task.completed_at = now_utc()
    task.lease_token_hash = ""
    task.lease_expires_at = None
    record(db, task.id, actor, "completed", summary)
    db.commit()
    db.refresh(task)
    return task


def block(db: Session, *, task_id: int, actor: str, lease_token: str, blocker_type: str, detail: str):
    if blocker_type not in EXTERNAL_BLOCKERS:
        raise HTTPException(status_code=422, detail="technical blockers must be handed off, not parked")
    task = require_lease(db, task_id=task_id, actor=actor, lease_token=lease_token)
    task.status = "blocked_external"
    task.blocker_type = blocker_type
    task.blocker_detail = detail
    task.lease_token_hash = ""
    task.lease_expires_at = None
    record(db, task.id, actor, "blocked_external", f"{blocker_type}: {detail}")
    db.commit()
    db.refresh(task)
    return task


def dashboard(db: Session) -> dict:
    recovered = recover_expired(db)
    counts = dict(db.query(AgentCoordinationTask.status, func.count(AgentCoordinationTask.id)).group_by(AgentCoordinationTask.status).all())
    active = (
        db.query(AgentCoordinationTask)
        .filter(AgentCoordinationTask.status.in_(["queued", "running", "blocked_external"]))
        .order_by(AgentCoordinationTask.created_at)
        .limit(50)
        .all()
    )
    return {"recovered": recovered, "counts": counts, "tasks": [serialize_task(task) for task in active]}
