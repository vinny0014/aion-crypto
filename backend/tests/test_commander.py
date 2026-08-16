import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models import Task
from app.pipeline.commander import Commander


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/pipe.db")
    Base.metadata.create_all(engine)
    s = sessionmaker(bind=engine)()
    yield s
    s.close()


def test_success_path(session):
    c = Commander(session)
    ran = []
    c.register("discovery", lambda p: ran.append(p) or {"ok": True})
    c.enqueue("discovery", {"source": "rss"})
    stats = c.run_cycle()
    assert stats["done"] == 1 and ran == [{"source": "rss"}]
    task = session.execute(select(Task)).scalar_one()
    assert task.status == "done" and task.attempts == 1


def test_retry_then_dead_letter(session):
    c = Commander(session)
    def boom(_): raise RuntimeError("network down")
    c.register("content", boom)
    task = c.enqueue("content", max_attempts=3)
    assert c.run_cycle()["failed"] == 1     # attempt 1 -> requeued
    task.available_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    session.commit()
    assert c.run_cycle()["failed"] == 1     # attempt 2 -> requeued
    task.available_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    session.commit()
    assert c.run_cycle()["dead"] == 1       # attempt 3 -> dead-letter
    assert task.status == "dead" and "network down" in task.last_error


def test_unregistered_kind_fails_loudly(session):
    c = Commander(session)
    c.enqueue("ghost-agent")
    stats = c.run_cycle()
    assert stats["skipped_no_handler"] == 1
    task = session.execute(select(Task)).scalar_one()
    assert task.status == "dead" and "no handler" in task.last_error


def test_stuck_task_recovery(session):
    c = Commander(session)
    c.register("image", lambda p: None)
    t = c.enqueue("image")
    # simulate crash mid-run 20 minutes ago
    t.status = "running"
    t.locked_at = datetime.now(timezone.utc) - timedelta(minutes=20)
    session.commit()
    recovered = c.recover_stuck()
    assert recovered == 1
    assert c.run_cycle()["done"] == 1


def test_cycle_limit(session):
    from app.pipeline import commander as mod
    c = Commander(session)
    c.register("t", lambda p: None)
    for _ in range(mod.MAX_TASKS_PER_CYCLE + 5):
        c.enqueue("t")
    stats = c.run_cycle()
    assert stats["done"] == mod.MAX_TASKS_PER_CYCLE  # anti-loop bound respected


def test_regression_failed_task_not_retried_in_same_cycle(session):
    """Regression: a failing task must wait for the next cycle, not burn all
    attempts inside one cycle (backoff would be meaningless otherwise)."""
    c = Commander(session)
    calls = {"n": 0}
    def flaky(_):
        calls["n"] += 1
        raise RuntimeError("still down")
    c.register("verify", flaky)
    c.enqueue("verify", max_attempts=5)
    c.run_cycle()
    assert calls["n"] == 1  # exactly one attempt per cycle


def test_enqueue_is_idempotent(session):
    commander = Commander(session)
    first = commander.enqueue("demo", {"value": 1}, idempotency_key="same-event")
    second = commander.enqueue("demo", {"value": 2}, idempotency_key="same-event")
    assert first.id == second.id


def test_retry_honors_backoff_window(session):
    commander = Commander(session)

    def fail(_):
        raise RuntimeError("boom")

    commander.register("fail", fail)
    task = commander.enqueue("fail", max_attempts=3)
    commander.run_cycle()
    session.refresh(task)
    assert task.status == "queued"
    attempts = task.attempts
    commander.run_cycle()
    session.refresh(task)
    assert task.attempts == attempts
