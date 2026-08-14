from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/arena.db")
    monkeypatch.setenv("MASCOT_VOTE_IP_DAILY_LIMIT", "2")
    import app.db as dbmod
    from app.config import get_settings

    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None


def test_public_ranking_and_daily_vote_limit(client):
    initial = client.get("/api/v1/mascot-arena").json()
    assert initial["round"]["status"] == "active"
    assert len(initial["ranking"]) == 10
    assert initial["champion"]["symbol"] == "BTC"

    payload = {"mascot": "XRP", "device_token": "device-token-00000001", "source": "test"}
    accepted = client.post("/api/v1/mascot-arena/votes", json=payload)
    assert accepted.status_code == 201
    assert accepted.json()["champion"]["symbol"] == "XRP"
    assert accepted.json()["round"]["total_votes"] == 1
    personalized = client.get("/api/v1/mascot-arena", headers={"X-Arena-Device": payload["device_token"]})
    assert personalized.json()["can_vote"] is False
    assert personalized.json()["next_vote_at"]

    duplicate = client.post("/api/v1/mascot-arena/votes", json=payload)
    assert duplicate.status_code == 429
    assert "next_vote_at" in duplicate.json()["detail"]

    second = client.post("/api/v1/mascot-arena/votes", json={
        "mascot": "BTC", "device_token": "device-token-00000002", "source": "test"
    })
    assert second.status_code == 201
    network_limited = client.post("/api/v1/mascot-arena/votes", json={
        "mascot": "ETH", "device_token": "device-token-00000003", "source": "test"
    })
    assert network_limited.status_code == 429


def test_unknown_mascot_is_rejected(client):
    response = client.post("/api/v1/mascot-arena/votes", json={
        "mascot": "FAKE", "device_token": "device-token-00000009"
    })
    assert response.status_code == 404


def test_expired_round_is_finalized_into_hall_of_fame(client):
    from app.db import get_sessionmaker
    from app.services.arena import arena_state, cast_vote

    db = get_sessionmaker()()
    first = datetime(2026, 8, 10, 12, tzinfo=timezone.utc)
    cast_vote(
        db, symbol="ETH", device_token="weekly-device-0001", client_ip="192.0.2.1",
        user_agent="test", source="test", now=first,
    )
    following_week = first + timedelta(days=8)
    state = arena_state(db, now=following_week)
    assert state["round"]["week"] != "2026-W33"
    assert state["hall_of_fame"][0]["symbol"] == "ETH"
    assert state["hall_of_fame"][0]["championships"] == 1
    db.close()
