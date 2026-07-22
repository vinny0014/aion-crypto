from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.cost_guard import CostGuard
from app.db import get_db
from app.routers.auth import require_role

router = APIRouter(prefix="/api/v1/cost", tags=["cost"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _=Depends(require_role("admin", "editor"))):
    return CostGuard(db).summary()
