"""Public Mascot Arena state and vote endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.arena import VoteUnavailable, arena_state, cast_vote, voter_hash

router = APIRouter(prefix="/api/v1/mascot-arena", tags=["mascot-arena"])


class VoteRequest(BaseModel):
    mascot: str = Field(min_length=2, max_length=10, pattern=r"^[A-Za-z]+$")
    device_token: str = Field(min_length=16, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")
    source: str = Field(default="arena", max_length=120)


def _client_ip(request: Request) -> str:
    # Production's trusted reverse proxy appends this header. Hashing happens
    # immediately in the service; raw network addresses are never persisted.
    forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
    return forwarded or (request.client.host if request.client else "unknown")


@router.get("")
def get_arena(
    request: Request,
    x_arena_device: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    voter = None
    if x_arena_device and 16 <= len(x_arena_device) <= 128:
        voter = voter_hash(x_arena_device, _client_ip(request), request.headers.get("user-agent", ""))
    return arena_state(db, voter=voter)


@router.post("/votes", status_code=status.HTTP_201_CREATED)
def vote(payload: VoteRequest, request: Request, db: Session = Depends(get_db)):
    try:
        return cast_vote(
            db,
            symbol=payload.mascot,
            device_token=payload.device_token,
            client_ip=_client_ip(request),
            user_agent=request.headers.get("user-agent", ""),
            source=payload.source,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except VoteUnavailable as exc:
        detail: dict[str, object] = {"message": exc.message}
        if exc.next_vote_at:
            detail["next_vote_at"] = exc.next_vote_at.isoformat()
        raise HTTPException(status_code=429, detail=detail) from exc
