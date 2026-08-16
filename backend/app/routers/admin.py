from sqlalchemy import func, select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.cost_guard import CostGuard
from app.db import get_db
from app.models import Article, Incident, SocialOutbox, Source, Subscriber, Task
from app.pipeline.registry import AGENTS
from app.routers.auth import require_role
from app.services.scheduler import scheduler_status

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/overview")
def overview(db: Session = Depends(get_db), _=Depends(require_role("admin", "editor"))):
    task_rows = db.execute(select(Task.status, func.count(Task.id)).group_by(Task.status)).all()
    open_incidents = db.execute(
        select(func.count(Incident.id)).where(Incident.status != "resolved")
    ).scalar_one()
    return {
        "tasks": {status: count for status, count in task_rows},
        "open_incidents": open_incidents,
        "cost_guard": CostGuard(db).summary(),
        "scheduler": scheduler_status(db),
        "agents": {"status": "connected", "registered": list(AGENTS)},
        "content": {
            "published": db.execute(select(func.count(Article.id)).where(Article.status.in_(("published", "updated")))).scalar_one(),
            "drafts": db.execute(select(func.count(Article.id)).where(Article.status.in_(("detected", "normalized", "verifying", "verified", "drafting", "reviewing", "ready")))).scalar_one(),
            "rejected": db.execute(select(func.count(Article.id)).where(Article.status.in_(("rejected", "compliance_failed", "failed")))).scalar_one(),
            "sources": db.execute(select(func.count(Source.id))).scalar_one(),
            "subscribers": db.execute(select(func.count(Subscriber.id)).where(Subscriber.confirmed.is_(True), Subscriber.unsubscribed.is_(False))).scalar_one(),
            "social_prepared": db.execute(select(func.count(SocialOutbox.id)).where(SocialOutbox.status == "prepared")).scalar_one(),
        },
    }
