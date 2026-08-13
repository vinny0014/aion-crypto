import base64
import hashlib
import json
import time

import pytest
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from fastapi.testclient import TestClient


@pytest.fixture
def signed_client(tmp_path, monkeypatch):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_pem = private_key.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/manus.db")
    monkeypatch.setenv("MANUS_WEBHOOK_PUBLIC_KEY", public_pem)
    import app.db as dbmod
    from app.config import get_settings

    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None
    from app.main import app

    with TestClient(app, base_url="https://aion-crypto-api.onrender.com") as client:
        yield client, private_key
    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None


def _signed_headers(private_key, body: bytes, *, timestamp: int | None = None) -> dict[str, str]:
    timestamp = timestamp or int(time.time())
    url = "https://aion-crypto-api.onrender.com/internal/manus/webhook"
    content = f"{timestamp}.{url}.{hashlib.sha256(body).hexdigest()}".encode()
    signature = private_key.sign(content, padding.PKCS1v15(), hashes.SHA256())
    return {
        "Content-Type": "application/json",
        "X-Webhook-Timestamp": str(timestamp),
        "X-Webhook-Signature": base64.b64encode(signature).decode(),
    }


def test_webhook_rejects_unsigned_request(signed_client):
    client, _ = signed_client
    response = client.post("/internal/manus/webhook", json={})
    assert response.status_code == 401


def test_webhook_accepts_and_deduplicates_valid_event(signed_client):
    client, private_key = signed_client
    payload = {
        "event_id": "evt-123",
        "event_type": "task_stopped",
        "task_detail": {
            "task_id": "task-456",
            "title": "AION production check",
            "url": "https://manus.im/app/task-456",
            "stop_reason": "finish",
            "message": "Checks completed.",
        },
    }
    body = json.dumps(payload, separators=(",", ":")).encode()
    headers = _signed_headers(private_key, body)

    first = client.post("/internal/manus/webhook", content=body, headers=headers)
    duplicate = client.post("/internal/manus/webhook", content=body, headers=headers)
    assert first.status_code == 200
    assert first.json() == {"status": "received", "event_id": "evt-123"}
    assert duplicate.status_code == 200
    assert duplicate.json() == {"status": "duplicate", "event_id": "evt-123"}

    from app.db import get_sessionmaker
    from app.models import ManusWebhookEvent

    with get_sessionmaker()() as db:
        events = db.query(ManusWebhookEvent).all()
        assert len(events) == 1
        assert events[0].task_id == "task-456"


def test_webhook_rejects_replayed_timestamp(signed_client):
    client, private_key = signed_client
    body = b'{"event_id":"evt-old","event_type":"task_created","task_detail":{"task_id":"task-old"}}'
    headers = _signed_headers(private_key, body, timestamp=int(time.time()) - 301)
    response = client.post("/internal/manus/webhook", content=body, headers=headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "expired webhook timestamp"


def test_webhook_rejects_signature_for_different_body(signed_client):
    client, private_key = signed_client
    signed_body = b'{"event_id":"evt-a","event_type":"task_created","task_detail":{"task_id":"task-a"}}'
    altered_body = signed_body.replace(b"task-a", b"task-b")
    response = client.post(
        "/internal/manus/webhook",
        content=altered_body,
        headers=_signed_headers(private_key, signed_body),
    )
    assert response.status_code == 401
