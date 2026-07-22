import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.cost_guard import Band, CostBlockedError, CostGuard, Priority
from app.db import Base


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/cost.db")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    s = Session()
    yield s
    s.close()


def spend(guard, amount):
    guard.record(provider="anthropic", model="test", agent="content", task="t", cost_usd=amount)


def test_bands_progress(session):
    g = CostGuard(session)
    assert g.band() == Band.NORMAL
    spend(g, 7.5)
    assert g.band() == Band.ECONOMY
    spend(g, 1.6)  # 9.1
    assert g.band() == Band.ESSENTIAL_ONLY
    spend(g, 1.0)  # 10.1
    assert g.band() == Band.BLOCKED


def test_blocked_raises(session):
    g = CostGuard(session)
    spend(g, 10.0)
    with pytest.raises(CostBlockedError):
        g.ensure_allowed(Priority.ESSENTIAL)


def test_economy_blocks_low_priority(session):
    g = CostGuard(session)
    spend(g, 8.0)
    with pytest.raises(CostBlockedError):
        g.ensure_allowed(Priority.LOW)
    g.ensure_allowed(Priority.MEDIUM)  # allowed


def test_summary_shape(session):
    g = CostGuard(session)
    spend(g, 2.5)
    s = g.summary()
    assert s["month_spend_usd"] == pytest.approx(2.5)
    assert s["band"] == "NORMAL"
    assert s["remaining_usd"] == pytest.approx(7.5)
