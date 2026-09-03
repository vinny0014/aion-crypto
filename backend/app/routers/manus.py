"""Authenticated, replay-resistant inbox for Manus webhook events."""
from __future__ import annotations

import base64
import binascii
import hashlib
import secrets
import time

import httpx
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import ManusWebhookEvent
from app.services import agent_coordination as coordination

router = APIRouter(prefix="/internal/manus", tags=["internal"])


class ManusCommand(BaseModel):
    command: str = Field(min_length=1, max_length=20_000)


class CoordinationCreate(BaseModel):
    idempotency_key: str = Field(min_length=4, max_length=160, pattern=r"^[A-Za-z0-9._:-]+$")
    title: str = Field(min_length=1, max_length=300)
    instructions: str = Field(min_length=1, max_length=20_000)
    actor: str = Field(pattern=r"^(codex|manus)$")
    max_attempts: int = Field(default=6, ge=2, le=20)


class CoordinationClaim(BaseModel):
    actor: str = Field(pattern=r"^(codex|manus)$")
    lease_seconds: int = Field(default=900, ge=60, le=1800)


class CoordinationLease(BaseModel):
    actor: str = Field(pattern=r"^(codex|manus)$")
    lease_token: str = Field(min_length=32, max_length=200)


class CoordinationHeartbeat(CoordinationLease):
    lease_seconds: int = Field(default=900, ge=60, le=1800)


class CoordinationHandoff(CoordinationLease):
    next_actor: str = Field(pattern=r"^(codex|manus)$")
    detail: str = Field(default="", max_length=10_000)


class CoordinationComplete(CoordinationLease):
    summary: str = Field(min_length=1, max_length=10_000)


class CoordinationBlock(CoordinationLease):
    blocker_type: str = Field(max_length=40)
    detail: str = Field(min_length=1, max_length=10_000)


def _reject(detail: str = "invalid webhook signature") -> None:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def _verify_signature(*, body: bytes, url: str, signature: str | None, timestamp: str | None) -> None:
    settings = get_settings()
    if not settings.manus_webhook_public_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="webhook verification unavailable")
    if not signature or not timestamp:
        _reject()
    try:
        timestamp_value = int(timestamp)
    except (TypeError, ValueError):
        _reject()
    if abs(int(time.time()) - timestamp_value) > settings.manus_webhook_max_age_seconds:
        _reject("expired webhook timestamp")

    pem = settings.manus_webhook_public_key.strip()
    if "\n" not in pem and "\\n" in pem:
        pem = pem.replace("\\n", "\n")
    try:
        public_key = serialization.load_pem_public_key(pem.encode("utf-8"))
        if not isinstance(public_key, rsa.RSAPublicKey) or public_key.key_size < 2048:
            raise ValueError("unsupported public key")
        decoded_signature = base64.b64decode(signature, validate=True)
        body_hash = hashlib.sha256(body).hexdigest()
        signed_content = f"{timestamp}.{url}.{body_hash}".encode("utf-8")
        public_key.verify(decoded_signature, signed_content, padding.PKCS1v15(), hashes.SHA256())
    except (ValueError, TypeError, binascii.Error, InvalidSignature):
        _reject()


def _limited_string(value: object, limit: int) -> str:
    return value[:limit] if isinstance(value, str) else ""


def _authorize_command(token: str | None) -> None:
    configured = get_settings().scheduler_token
    if not configured or token is None or not secrets.compare_digest(token, configured):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid scheduler token")


async def _send_manus_message(text: str) -> dict:
    settings = get_settings()
    if not settings.manus_api_key:
        raise HTTPException(status_code=503, detail="Manus API is not configured")
    payload = {
        "task_id": "agent-default-main_task",
        "message": {"content": [{"type": "text", "text": text}]},
        "agent_profile": "manus-1.6",
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.manus.ai/v2/task.sendMessage",
                headers={"x-manus-api-key": settings.manus_api_key},
                json=payload,
            )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Manus API is temporarily unreachable")
    try:
        result = response.json()
    except ValueError:
        result = {}
    if response.status_code != 200 or not result.get("ok"):
        error_code = (result.get("error") or {}).get("code", "provider_error")
        raise HTTPException(status_code=502, detail=f"Manus API rejected the command: {error_code}")
    return result


@router.get("/health")
def manus_webhook_health():
    settings = get_settings()
    return {
        "status": "ready" if settings.manus_webhook_public_key else "unconfigured",
        "signature_verification": bool(settings.manus_webhook_public_key),
    }


@router.post("/send")
async def send_manus_command(
    command: ManusCommand,
    x_scheduler_token: str | None = Header(default=None),
):
    """Send one protected command to the account's persistent Manus agent."""
    _authorize_command(x_scheduler_token)
    normalized_command = command.command.strip()
    if not normalized_command:
        raise HTTPException(status_code=422, detail="command cannot be blank")
    result = await _send_manus_message(normalized_command)
    return {
        "status": "sent",
        "task_id": result.get("task_id", "agent-default-main_task"),
        "request_id": result.get("request_id", ""),
    }


@router.post("/coordination/tasks")
def create_coordination_task(
    payload: CoordinationCreate,
    x_scheduler_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _authorize_command(x_scheduler_token)
    if not payload.title.strip() or not payload.instructions.strip():
        raise HTTPException(status_code=422, detail="title and instructions cannot be blank")
    task, created = coordination.create_task(
        db,
        idempotency_key=payload.idempotency_key,
        title=payload.title.strip(),
        instructions=payload.instructions.strip(),
        actor=payload.actor,
        max_attempts=payload.max_attempts,
    )
    return {"status": "created" if created else "duplicate", "task": coordination.serialize_task(task)}


@router.post("/coordination/claim")
def claim_coordination_task(
    payload: CoordinationClaim,
    x_scheduler_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _authorize_command(x_scheduler_token)
    task, lease_token = coordination.claim_next(db, actor=payload.actor, lease_seconds=payload.lease_seconds)
    if not task:
        return {"status": "empty", "task": None}
    return {"status": "claimed", "lease_token": lease_token, "task": coordination.serialize_task(task)}


@router.post("/coordination/{task_id}/heartbeat")
def heartbeat_coordination_task(task_id: int, payload: CoordinationHeartbeat, db: Session = Depends(get_db)):
    task = coordination.heartbeat(
        db,
        task_id=task_id,
        actor=payload.actor,
        lease_token=payload.lease_token,
        lease_seconds=payload.lease_seconds,
    )
    return {"status": "running", "task": coordination.serialize_task(task, include_instructions=False)}


@router.post("/coordination/{task_id}/handoff")
def handoff_coordination_task(task_id: int, payload: CoordinationHandoff, db: Session = Depends(get_db)):
    if payload.next_actor == payload.actor:
        raise HTTPException(status_code=422, detail="handoff must change the responsible actor")
    task = coordination.handoff(
        db,
        task_id=task_id,
        actor=payload.actor,
        lease_token=payload.lease_token,
        next_actor=payload.next_actor,
        detail=payload.detail,
    )
    return {"status": "handed_off", "task": coordination.serialize_task(task)}


@router.post("/coordination/{task_id}/complete")
def complete_coordination_task(task_id: int, payload: CoordinationComplete, db: Session = Depends(get_db)):
    task = coordination.complete(
        db,
        task_id=task_id,
        actor=payload.actor,
        lease_token=payload.lease_token,
        summary=payload.summary,
    )
    return {"status": "completed", "task": coordination.serialize_task(task, include_instructions=False)}


@router.post("/coordination/{task_id}/block")
def block_coordination_task(task_id: int, payload: CoordinationBlock, db: Session = Depends(get_db)):
    task = coordination.block(
        db,
        task_id=task_id,
        actor=payload.actor,
        lease_token=payload.lease_token,
        blocker_type=payload.blocker_type,
        detail=payload.detail,
    )
    return {"status": "blocked_external", "task": coordination.serialize_task(task, include_instructions=False)}


@router.get("/coordination/status")
def coordination_status(
    x_scheduler_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _authorize_command(x_scheduler_token)
    return coordination.dashboard(db)


async def _dispatch_claimed_coordination_task(db: Session, task, lease_token: str) -> dict:
    callback_base = "https://aion-crypto-api.onrender.com/internal/manus/coordination"
    command = f"""AION COORDINATION TASK #{task.id}
Title: {task.title}

{task.instructions}

RULES:
- You own this task for 15 minutes. Do not wait silently.
- Send heartbeat to {callback_base}/{task.id}/heartbeat before the lease expires.
- If Codex can solve a technical blocker, hand off to {callback_base}/{task.id}/handoff with next_actor=codex.
- Complete at {callback_base}/{task.id}/complete.
- Block only for payment, CAPTCHA, login, 2FA, or business decision at {callback_base}/{task.id}/block.
- Use actor=manus and this task-scoped lease_token in lifecycle requests: {lease_token}
- Never reveal the lease token in reports or chat.
"""
    try:
        result = await _send_manus_message(command)
    except HTTPException as exc:
        coordination.retry_dispatch_failure(
            db,
            task_id=task.id,
            actor="manus",
            lease_token=lease_token,
            detail=f"Manus dispatch failed; retry scheduled: {exc.detail}",
        )
        raise
    return {
        "status": "dispatched",
        "coordination_task_id": task.id,
        "manus_task_id": result.get("task_id", "agent-default-main_task"),
        "request_id": result.get("request_id", ""),
    }


@router.post("/coordination/{task_id}/dispatch-manus")
async def dispatch_coordination_task_to_manus(
    task_id: int,
    x_scheduler_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    _authorize_command(x_scheduler_token)
    task, lease_token = coordination.claim_task(db, task_id=task_id, actor="manus")
    return await _dispatch_claimed_coordination_task(db, task, lease_token)


@router.post("/coordination/tick")
async def tick_coordination(
    x_scheduler_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Recover stale work and dispatch at most one queued Manus task."""
    _authorize_command(x_scheduler_token)
    recovered = coordination.recover_expired(db)
    task, lease_token = coordination.claim_next(db, actor="manus")
    if not task:
        return {"status": "idle", "recovered": recovered, "dashboard": coordination.dashboard(db)}
    result = await _dispatch_claimed_coordination_task(db, task, lease_token)
    result["recovered"] = recovered
    return result


@router.post("/webhook")
async def manus_webhook(
    request: Request,
    x_webhook_signature: str | None = Header(default=None),
    x_webhook_timestamp: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.manus_webhook_max_body_bytes:
                raise HTTPException(status_code=413, detail="webhook payload too large")
        except ValueError:
            raise HTTPException(status_code=400, detail="invalid content length")
    body = await request.body()
    if len(body) > settings.manus_webhook_max_body_bytes:
        raise HTTPException(status_code=413, detail="webhook payload too large")

    _verify_signature(
        body=body,
        url=str(request.url),
        signature=x_webhook_signature,
        timestamp=x_webhook_timestamp,
    )
    try:
        payload = await request.json()
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid JSON payload")
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="invalid webhook payload")

    event_id = _limited_string(payload.get("event_id") or payload.get("id"), 200)
    event_type = _limited_string(payload.get("event_type") or payload.get("type"), 40)
    task_detail = payload.get("task_detail") or payload.get("data") or {}
    if not isinstance(task_detail, dict):
        task_detail = {}
    task_id = _limited_string(task_detail.get("task_id") or payload.get("task_id"), 200)
    if not event_id or event_type not in {"task_created", "task_stopped"} or not task_id:
        raise HTTPException(status_code=422, detail="unsupported or incomplete webhook event")

    event = ManusWebhookEvent(
        event_id=event_id,
        event_type=event_type,
        task_id=task_id,
        task_title=_limited_string(task_detail.get("title"), 500),
        task_url=_limited_string(task_detail.get("url"), 1000),
        stop_reason=_limited_string(task_detail.get("stop_reason") or payload.get("stop_reason"), 40),
        message=_limited_string(task_detail.get("message") or payload.get("message"), 10000),
    )
    db.add(event)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"status": "duplicate", "event_id": event_id}
    return {"status": "received", "event_id": event_id}
