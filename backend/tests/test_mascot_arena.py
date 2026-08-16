import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event


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
    assert [item["symbol"] for item in initial["ranking"]] == [
        "BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK",
        "AVAX", "DOT", "SHIB", "PEPE", "HYPE", "TRX", "SUI",
    ]
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


def test_proxy_authenticated_ip_prevents_forwarded_header_rotation(client):
    trusted_edge_ip = "198.51.100.77"
    for index in range(2):
        response = client.post(
            "/api/v1/mascot-arena/votes",
            headers={"X-Forwarded-For": f"203.0.113.{index}, {trusted_edge_ip}"},
            json={"mascot": "BTC", "device_token": f"proxy-device-0000000{index}"},
        )
        assert response.status_code == 201

    limited = client.post(
        "/api/v1/mascot-arena/votes",
        headers={"X-Forwarded-For": f"192.0.2.200, {trusted_edge_ip}"},
        json={"mascot": "ETH", "device_token": "proxy-device-00000002"},
    )
    assert limited.status_code == 429


def test_rolling_cooldown_survives_weekly_round_rollover(client):
    from app.db import get_sessionmaker
    from app.services.arena import VoteUnavailable, cast_vote

    db = get_sessionmaker()()
    sunday = datetime(2026, 8, 16, 23, 30, tzinfo=timezone.utc)
    cast_vote(
        db, symbol="BTC", device_token="rollover-device-0001", client_ip="192.0.2.40",
        user_agent="test", source="test", now=sunday,
    )
    with pytest.raises(VoteUnavailable, match="Next vote"):
        cast_vote(
            db, symbol="ETH", device_token="rollover-device-0001", client_ip="192.0.2.40",
            user_agent="test", source="test", now=sunday + timedelta(hours=1),
        )
    db.close()


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
    assert len(state["ranking"]) == 15
    assert "TON" in {item["symbol"] for item in state["ranking"]}
    assert "SUI" not in {item["symbol"] for item in state["ranking"]}
    assert state["last_rotation"] == {
        "relegated": {"symbol": "SUI", "coin": "Sui", "title": "The Tidal Blade"},
        "promoted": {"symbol": "TON", "coin": "Toncoin", "title": "The Network Voyager"},
        "week": "2026-W33",
    }
    assert state["next_challenger"]["symbol"] == "MATIC"
    with pytest.raises(ValueError, match="not active"):
        cast_vote(
            db, symbol="SUI", device_token="weekly-device-0002", client_ip="192.0.2.2",
            user_agent="test", source="test", now=following_week,
        )
    db.close()


def test_historical_top_10_round_is_preserved_when_top_15_starts(client):
    from app.db import get_sessionmaker
    from app.models import MascotArenaRound
    from app.services.arena import STARTING_ROSTER, _round_roster, arena_state

    db = get_sessionmaker()()
    historical_roster = STARTING_ROSTER[:10]
    historical = MascotArenaRound(
        week_key="2026-W32",
        status="completed",
        starts_at=datetime(2026, 8, 3, tzinfo=timezone.utc),
        ends_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
        champion_symbol="BTC",
        top_three_json='[{"symbol": "BTC", "votes": 0, "position": 1}]',
        roster_json=json.dumps(historical_roster),
        reserve_json=json.dumps(["TON", "MATIC"]),
        next_roster_json=json.dumps([*historical_roster[:-1], "TON"]),
        next_reserve_json=json.dumps(["MATIC", historical_roster[-1]]),
        relegated_symbol="DOT",
        promoted_symbol="TON",
        finalized_at=datetime(2026, 8, 10, tzinfo=timezone.utc),
        created_at=datetime(2026, 8, 3, tzinfo=timezone.utc),
    )
    db.add(historical)
    db.commit()
    db.refresh(historical)

    state = arena_state(db, now=datetime(2026, 8, 11, tzinfo=timezone.utc))

    assert _round_roster(historical) == historical_roster
    assert len(state["ranking"]) == 15
    assert [item["symbol"] for item in state["ranking"]] == STARTING_ROSTER
    db.refresh(historical)
    assert json.loads(historical.roster_json) == historical_roster
    db.close()


def test_latest_stories_are_loaded_with_one_aggregate_query(client):
    from app.db import get_engine, get_sessionmaker
    from app.models import Article
    from app.services.arena import STARTING_ROSTER, arena_state

    db = get_sessionmaker()()
    published_at = datetime(2026, 8, 16, 12, tzinfo=timezone.utc)
    for symbol in STARTING_ROSTER:
        db.add(Article(
            slug=f"{symbol.lower()}-verified-update",
            title=f"{symbol} verified update",
            summary="Verified coverage.",
            body="Verified body.",
            category="Markets",
            related_asset=symbol,
            status="published",
            published_at=published_at,
            is_fixture=False,
        ))
    db.commit()

    article_selects = 0

    def count_article_selects(_conn, _cursor, statement, _parameters, _context, _executemany):
        nonlocal article_selects
        if statement.lstrip().upper().startswith("SELECT") and "articles" in statement.lower():
            article_selects += 1

    engine = get_engine()
    event.listen(engine, "before_cursor_execute", count_article_selects)
    try:
        state = arena_state(db, now=published_at)
    finally:
        event.remove(engine, "before_cursor_execute", count_article_selects)

    assert article_selects == 1
    assert all(item["latest_news"] for item in state["ranking"])
    db.close()
