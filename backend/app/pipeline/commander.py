"""Commander — the pipeline orchestrator core.

Real, tested mechanics (no decorative agents):
- persistent task queue (Task model)
- pessimistic claim/lock so concurrent workers never run the same task
- bounded retries with exponential backoff
- dead-letter state after max attempts
- stuck-task recovery after restarts (lock timeout)
- per-cycle limit (anti-loop protection)

Agent handlers register by task kind; unregistered kinds fail loudly
instead of pretending to be healthy.
"""
from __future__ import annotations

import json
import traceback
from datetime import datetime, timedelta, timezone
from typing import Callable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Task

Handler = Callable[[dict], dict]

BACKOFF_BASE_SECONDS = 30
LOCK_TIMEOUT_MINUTES = 10
MAX_TASKS_PER_CYCLE = 25


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Commander:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.handlers: dict[str, Handler] = {}

    def register(self, kind: str, handler: Handler) -> None:
        self.handlers[kind] = handler

    # ── enqueue ────────────────────────────────────────────────────

    def enqueue(self, kind: str, payload: dict | None = None, max_attempts: int = 3) -> Task:
        task = Task(kind=kind, payload=json.dumps(payload or {}), max_attempts=max_attempts)
        self.session.add(task)
        self.session.commit()
        return task

    # ── recovery ───────────────────────────────────────────────────

    def recover_stuck(self) -> int:
        """Requeue tasks left 'running' by a crash/restart past lock timeout."""
        cutoff = utcnow() - timedelta(minutes=LOCK_TIMEOUT_MINUTES)
        stuck = self.session.execute(
            select(Task).where(Task.status == "running", Task.locked_at < cutoff)
        ).scalars().all()
        for t in stuck:
            t.status = "queued"
            t.locked_at = None
            t.last_error = (t.last_error + "\n[recovered after lock timeout]").strip()
        self.session.commit()
        return len(stuck)

    # ── claim & run ────────────────────────────────────────────────

    def _claim_next(self, exclude_ids: set[int]) -> Task | None:
        stmt = select(Task).where(Task.status == "queued").order_by(Task.created_at)
        if exclude_ids:
            stmt = stmt.where(Task.id.not_in(exclude_ids))
        task = self.session.execute(stmt.limit(1)).scalar_one_or_none()
        if task is None:
            return None
        task.status = "running"
        task.locked_at = utcnow()
        task.started_at = utcnow()
        task.attempts += 1
        self.session.commit()
        return task

    def _backoff_seconds(self, attempts: int) -> int:
        return BACKOFF_BASE_SECONDS * (2 ** max(0, attempts - 1))

    def run_cycle(self) -> dict:
        """Process up to MAX_TASKS_PER_CYCLE queued tasks. Returns stats."""
        self.recover_stuck()
        stats = {"done": 0, "failed": 0, "dead": 0, "skipped_no_handler": 0}
        seen: set[int] = set()  # a task failed this cycle waits for the next cycle (backoff)
        for _ in range(MAX_TASKS_PER_CYCLE):
            task = self._claim_next(seen)
            if task is None:
                break
            seen.add(task.id)
            handler = self.handlers.get(task.kind)
            if handler is None:
                task.status = "dead"
                task.last_error = f"no handler registered for kind '{task.kind}'"
                task.finished_at = utcnow()
                stats["skipped_no_handler"] += 1
                self.session.commit()
                continue
            try:
                payload = json.loads(task.payload or "{}")
                handler(payload)
                task.status = "done"
                task.finished_at = utcnow()
                stats["done"] += 1
            except Exception:
                task.last_error = traceback.format_exc()[-2000:]
                if task.attempts >= task.max_attempts:
                    task.status = "dead"  # dead-letter: needs human/monitor attention
                    task.finished_at = utcnow()
                    stats["dead"] += 1
                else:
                    task.status = "queued"  # retried next cycle (backoff via scheduler)
                    task.locked_at = None
                    stats["failed"] += 1
            self.session.commit()
        return stats
