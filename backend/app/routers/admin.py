from sqlalchemy import func, select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from app.cost_guard import CostGuard
from app.db import get_db
from app.models import Incident, Task
from app.routers.auth import require_role

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
        "scheduler": {"status": "not_configured"},
        "agents": {"status": "not_connected", "registered": []},
    }
