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

router = APIRouter(prefix="/internal/manus", tags=["internal"])


class ManusCommand(BaseModel):
    command: str = Field(min_length=1, max_length=20_000)


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
    settings = get_settings()
    if not settings.manus_api_key:
        raise HTTPException(status_code=503, detail="Manus API is not configured")
    payload = {
        "task_id": "agent-default-main_task",
        "message": {"content": [{"type": "text", "text": normalized_command}]},
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
    return {
        "status": "sent",
        "task_id": result.get("task_id", "agent-default-main_task"),
        "request_id": result.get("request_id", ""),
    }


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
