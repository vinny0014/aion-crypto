"""Authenticated, per-user watchlists. Symbols are market identifiers only."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, WatchlistItem
from app.routers.auth import get_current_user
from app.services.market import COIN_REGISTRY

router = APIRouter(prefix="/api/v1/watchlist", tags=["watchlist"])


class WatchlistCreate(BaseModel):
    symbol: str = Field(min_length=2, max_length=20)


def serialize(item: WatchlistItem) -> dict:
    return {"id": item.id, "symbol": item.symbol, "position": item.position}


@router.get("")
def list_items(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.execute(select(WatchlistItem).where(WatchlistItem.user_id == user.id).order_by(WatchlistItem.position, WatchlistItem.id)).scalars().all()
    return {"data": [serialize(item) for item in items]}


@router.post("", status_code=status.HTTP_201_CREATED)
def add_item(body: WatchlistCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    symbol = body.symbol.upper().strip()
    if symbol not in COIN_REGISTRY:
        raise HTTPException(status_code=422, detail="Unsupported symbol")
    position = len(db.execute(select(WatchlistItem.id).where(WatchlistItem.user_id == user.id)).scalars().all())
    item = WatchlistItem(user_id=user.id, symbol=symbol, position=position)
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Symbol is already in this watchlist")
    db.refresh(item)
    return {"data": serialize(item)}


@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item(symbol: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.execute(select(WatchlistItem).where(WatchlistItem.user_id == user.id, WatchlistItem.symbol == symbol.upper())).scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Symbol is not in this watchlist")
    db.delete(item)
    db.commit()
