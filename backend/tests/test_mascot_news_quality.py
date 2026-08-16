from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models import Article
from app.services.arena import _latest_news


ACTIVE_SYMBOLS = [
    "BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK",
    "AVAX", "DOT", "SHIB", "PEPE", "HYPE", "TRX", "SUI",
]


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/mascot-news.db")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    yield db
    db.close()
    engine.dispose()


def article(symbol: str, suffix: str, published_at: datetime, *, fixture: bool = False) -> Article:
    return Article(
        slug=f"{symbol.lower()}-{suffix}",
        title=f"Verified {symbol} {suffix}",
        summary="Source-bound coverage.",
        body="Verified editorial body.",
        category="Markets",
        related_asset=symbol,
        status="published",
        published_at=published_at,
        is_fixture=fixture,
    )


def test_latest_story_for_all_15_mascots_is_resolved_in_one_query(session):
    now = datetime(2026, 8, 16, 12, tzinfo=timezone.utc)
    for symbol in ACTIVE_SYMBOLS:
        session.add(article(symbol, "older", now - timedelta(days=1)))
        session.add(article(symbol, "fresh", now - timedelta(hours=3, minutes=59)))
        session.add(article(symbol, "fixture", now - timedelta(minutes=1), fixture=True))
    session.commit()

    statements: list[str] = []

    def count_statement(_conn, _cursor, statement, _parameters, _context, _executemany):
        statements.append(statement)

    event.listen(session.get_bind(), "before_cursor_execute", count_statement)
    try:
        result = _latest_news(session, ACTIVE_SYMBOLS)
    finally:
        event.remove(session.get_bind(), "before_cursor_execute", count_statement)

    assert set(result) == set(ACTIVE_SYMBOLS)
    assert all(result[symbol]["slug"] == f"{symbol.lower()}-fresh" for symbol in ACTIVE_SYMBOLS)
    assert len(statements) == 1, "mascot stories must use one aggregate DB query, never per-card N+1 queries"
