"""Persistent, externally triggered editorial scheduler."""
from __future__ import annotations

from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Article, SchedulerRun, Source
from app.pipeline.commander import LOCK_TIMEOUT_MINUTES
from app.pipeline.editorial import utcnow
from app.pipeline.registry import build_commander
from app.services.arena import ensure_current_round


def scheduler_status(db: Session) -> dict:
    settings = get_settings()
    last = db.execute(select(SchedulerRun).order_by(SchedulerRun.started_at.desc()).limit(1)).scalar_one_or_none()
    return {
        "status": "active" if settings.scheduler_enabled else "not_configured",
        "provider": "github_actions" if settings.scheduler_enabled else "",
        "interval_minutes": settings.scheduler_interval_minutes if settings.scheduler_enabled else None,
        "last_run": last.finished_at if last else None,
        "last_result": last.status if last else None,
        "next_run": ((last.started_at if last else utcnow()) + timedelta(minutes=settings.scheduler_interval_minutes)) if settings.scheduler_enabled else None,
        "last_error": last.last_error if last and last.status == "failed" else "",
    }


def run_editorial_schedule(db: Session, *, trigger: str = "scheduled") -> dict:
    settings = get_settings()
    if not settings.scheduler_enabled:
        raise RuntimeError("scheduler is disabled")
    now = utcnow()
    bucket = now.strftime("%Y%m%d%H%M") if trigger == "manual" else now.strftime("%Y%m%d%H")
    run = SchedulerRun(run_key=f"{trigger}:{bucket}", trigger=trigger)
    try:
        db.add(run); db.commit(); db.refresh(run)
    except IntegrityError:
        db.rollback()
        return {"status": "duplicate_run", "run_key": f"{trigger}:{bucket}"}
    cutoff = now - timedelta(minutes=LOCK_TIMEOUT_MINUTES)
    active = db.execute(select(SchedulerRun).where(SchedulerRun.status == "running", SchedulerRun.id != run.id, SchedulerRun.started_at >= cutoff)).scalar_one_or_none()
    if active:
        run.status = "skipped"; run.finished_at = utcnow(); run.last_error = "another scheduler run holds the lease"; db.commit()
        return {"status": "locked", "run_id": run.id}
    try:
        # The Arena lifecycle shares the existing zero-cost scheduler. Reads
        # also run this guard, so a delayed scheduler never blocks voting.
        ensure_current_round(db, now)
        sources = db.execute(select(Source).where(Source.active.is_(True)).order_by(Source.id).limit(settings.scheduler_max_sources_per_run)).scalars().all()
        commander = build_commander(db)
        before = db.execute(select(func.count(Article.id))).scalar_one()
        for source in sources:
            commander.enqueue("source-scan", {"source_id": source.id}, idempotency_key=f"source:{source.id}:{now.strftime('%Y%m%d%H')}")
        stats = {"done": 0, "failed": 0, "dead": 0}
        for _ in range(8):
            cycle = commander.run_cycle()
            for key in stats:
                stats[key] += cycle.get(key, 0)
            if not cycle["done"] and not cycle["failed"]:
                break
        after = db.execute(select(func.count(Article.id))).scalar_one()
        run.sources_scanned = len(sources)
        run.articles_detected = max(0, after - before)
        run.items_seen = run.articles_detected
        run.published = db.execute(select(func.count(Article.id)).where(Article.published_at >= run.started_at)).scalar_one()
        run.status = "success" if not stats["failed"] and not stats["dead"] else "partial"
        run.finished_at = utcnow(); db.commit()
        return {"status": run.status, "run_id": run.id, "sources_scanned": run.sources_scanned, "articles_detected": run.articles_detected, "published": run.published, "tasks": stats}
    except Exception as exc:
        db.rollback()
        run = db.get(SchedulerRun, run.id)
        run.status = "failed"; run.finished_at = utcnow(); run.last_error = str(exc)[:1000]; db.commit()
        raise
