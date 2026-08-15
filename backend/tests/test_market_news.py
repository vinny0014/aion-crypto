from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.services.market_news import build_market_brief, publish_daily_market_brief


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/market-news.db")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    yield db
    db.close()


def market_rows():
    return [
        {"symbol": symbol, "name": name, "price": 100.0 + index,
         "change_24h_pct": float(index - 3), "high_24h": 110.0 + index,
         "low_24h": 90.0 + index, "volume_24h_quote": 1_000_000.0 + index}
        for index, (symbol, name) in enumerate([
            ("BTC", "Bitcoin"), ("ETH", "Ethereum"), ("XRP", "XRP"),
            ("SOL", "Solana"), ("BNB", "BNB"), ("DOGE", "Dogecoin"),
            ("ADA", "Cardano"), ("LINK", "Chainlink"),
        ])
    ]


def test_market_brief_is_original_time_bound_and_substantial():
    brief = build_market_brief(
        market_rows(), datetime(2026, 8, 15, 12, 30, tzinfo=timezone.utc), "binance"
    )
    assert brief["slug"] == "daily-crypto-market-snapshot-2026-08-15"
    assert "BTC" in brief["body"] and "LINK" in brief["body"]
    assert "12:30 UTC" in brief["body"]
    assert len(brief["body"]) >= 800


def test_daily_market_brief_publishes_once_after_all_gates(session, monkeypatch):
    async def live():
        return market_rows(), "binance"

    monkeypatch.setattr("app.services.market_news._fetch_live_snapshot", live)
    now = datetime(2026, 8, 15, 12, 30, tzinfo=timezone.utc)
    first = publish_daily_market_brief(session, now)
    second = publish_daily_market_brief(session, now)
    assert first["created"] is True and first["status"] == "published"
    assert second == {"article_id": first["article_id"], "status": "published", "created": False}
