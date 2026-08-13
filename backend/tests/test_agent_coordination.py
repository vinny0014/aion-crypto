from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/coordination.db")
    monkeypatch.setenv("SCHEDULER_TOKEN", "s" * 48)
    import app.db as dbmod
    from app.config import get_settings

    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None
    from app.main import app

    with TestClient(app) as value:
        yield value
    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None


def auth() -> dict[str, str]:
    return {"X-Scheduler-Token": "s" * 48}


def create_task(client, key="task:1", actor="manus"):
    return client.post(
        "/internal/manus/coordination/tasks",
        headers=auth(),
        json={
            "idempotency_key": key,
            "title": "Finish AION bridge",
            "instructions": "Validate production and report evidence.",
            "actor": actor,
        },
    )


def claim(client, actor="manus"):
    return client.post(
        "/internal/manus/coordination/claim",
        headers=auth(),
        json={"actor": actor, "lease_seconds": 900},
    )


def test_create_is_idempotent_and_private(client):
    assert client.post(
        "/internal/manus/coordination/tasks",
        json={
            "idempotency_key": "unauthorized:1",
            "title": "Private task",
            "instructions": "Must not be created.",
            "actor": "manus",
        },
    ).status_code == 401
    first = create_task(client)
    duplicate = create_task(client)
    assert first.status_code == 200
    assert first.json()["status"] == "created"
    assert duplicate.json()["status"] == "duplicate"
    assert duplicate.json()["task"]["id"] == first.json()["task"]["id"]
    assert client.get("/internal/manus/coordination/status").status_code == 401


def test_lease_heartbeat_handoff_and_completion(client):
    task_id = create_task(client).json()["task"]["id"]
    claimed = claim(client).json()
    token = claimed["lease_token"]
    assert claimed["task"]["status"] == "running"

    heartbeat = client.post(
        f"/internal/manus/coordination/{task_id}/heartbeat",
        json={"actor": "manus", "lease_token": token, "lease_seconds": 900},
    )
    assert heartbeat.status_code == 200

    handoff = client.post(
        f"/internal/manus/coordination/{task_id}/handoff",
        json={"actor": "manus", "lease_token": token, "next_actor": "codex", "detail": "Codex can fix CI"},
    )
    assert handoff.status_code == 200
    assert handoff.json()["task"]["current_actor"] == "codex"

    codex_claim = claim(client, "codex").json()
    complete = client.post(
        f"/internal/manus/coordination/{task_id}/complete",
        json={"actor": "codex", "lease_token": codex_claim["lease_token"], "summary": "CI fixed and verified"},
    )
    assert complete.status_code == 200
    assert complete.json()["task"]["status"] == "completed"


def test_technical_blocker_must_handoff(client):
    task_id = create_task(client).json()["task"]["id"]
    token = claim(client).json()["lease_token"]
    response = client.post(
        f"/internal/manus/coordination/{task_id}/block",
        json={"actor": "manus", "lease_token": token, "blocker_type": "technical", "detail": "CI failed"},
    )
    assert response.status_code == 422
    assert "handed off" in response.json()["detail"]


def test_external_blocker_can_pause(client):
    task_id = create_task(client).json()["task"]["id"]
    token = claim(client).json()["lease_token"]
    response = client.post(
        f"/internal/manus/coordination/{task_id}/block",
        json={"actor": "manus", "lease_token": token, "blocker_type": "payment", "detail": "Render billing action required"},
    )
    assert response.status_code == 200
    assert response.json()["task"]["status"] == "blocked_external"


def test_expired_lease_is_recovered_by_other_actor(client):
    task_id = create_task(client).json()["task"]["id"]
    claim(client)
    from app.db import get_sessionmaker
    from app.models import AgentCoordinationTask

    with get_sessionmaker()() as db:
        task = db.query(AgentCoordinationTask).filter_by(id=task_id).one()
        task.lease_expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.commit()

    status = client.get("/internal/manus/coordination/status", headers=auth())
    assert status.status_code == 200
    recovered = status.json()["tasks"][0]
    assert recovered["status"] == "queued"
    assert recovered["current_actor"] == "codex"
    assert recovered["attempts"] == 1

    assert claim(client, "manus").json()["status"] == "empty"
    assert claim(client, "codex").json()["status"] == "claimed"


def test_old_lease_token_cannot_mutate_after_handoff(client):
    task_id = create_task(client).json()["task"]["id"]
    token = claim(client).json()["lease_token"]
    client.post(
        f"/internal/manus/coordination/{task_id}/handoff",
        json={"actor": "manus", "lease_token": token, "next_actor": "codex", "detail": "handoff"},
    )
    response = client.post(
        f"/internal/manus/coordination/{task_id}/complete",
        json={"actor": "manus", "lease_token": token, "summary": "stale completion"},
    )
    assert response.status_code == 409


def test_watchdog_dispatches_one_manus_task(client, monkeypatch):
    task_id = create_task(client, key="task:watchdog").json()["task"]["id"]
    import app.routers.manus as manus_router

    async def fake_send(_text):
        return {"ok": True, "task_id": "agent-default-main_task", "request_id": "req-test"}

    monkeypatch.setattr(manus_router, "_send_manus_message", fake_send)
    response = client.post("/internal/manus/coordination/tick", headers=auth())
    assert response.status_code == 200
    assert response.json()["status"] == "dispatched"
    assert response.json()["coordination_task_id"] == task_id

    status = client.get("/internal/manus/coordination/status", headers=auth()).json()
    assert status["tasks"][0]["status"] == "running"
    assert status["tasks"][0]["current_actor"] == "manus"
