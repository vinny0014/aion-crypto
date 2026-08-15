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
    from app.models import Article
    from app.services.arena import arena_state, cast_vote

    db = get_sessionmaker()()
    first = datetime(2026, 8, 10, 12, tzinfo=timezone.utc)
    cast_vote(
        db, symbol="ETH", device_token="weekly-device-0001", client_ip="192.0.2.1",
        user_agent="test", source="test", now=first,
    )
    db.add(Article(
        slug="ethereum-weekly-update", title="Ethereum weekly update",
        summary="Verified Ethereum coverage.", body="Verified body.",
        category="Ethereum", related_asset="ETH", status="published",
        published_at=first, is_fixture=False,
    ))
    db.commit()
    following_week = first + timedelta(days=8)
    state = arena_state(db, now=following_week)
    assert state["round"]["week"] != "2026-W33"
    assert state["hall_of_fame"][0]["symbol"] == "ETH"
    assert state["hall_of_fame"][0]["championships"] == 1
    assert state["mascot_of_week"]["symbol"] == "ETH"
    assert state["mascot_of_week"]["votes"] == 1
    assert state["mascot_of_week"]["latest_news"]["slug"] == "ethereum-weekly-update"
    assert len(state["ranking"]) == 10
    assert "TON" in {item["symbol"] for item in state["ranking"]}
    assert "DOT" not in {item["symbol"] for item in state["ranking"]}
    assert state["last_rotation"] == {
        "relegated": {"symbol": "DOT", "coin": "Polkadot", "title": "The Multiverse Conductor"},
        "promoted": {"symbol": "TON", "coin": "Toncoin", "title": "The Network Voyager"},
        "week": "2026-W33",
    }
    assert state["next_challenger"]["symbol"] == "MATIC"
    with pytest.raises(ValueError, match="not active"):
        cast_vote(
            db, symbol="DOT", device_token="weekly-device-0002", client_ip="192.0.2.2",
            user_agent="test", source="test", now=following_week,
        )
    db.close()
