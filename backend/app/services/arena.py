"""Weekly Mascot Arena competition and privacy-preserving vote accounting."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import MascotArenaRound, MascotArenaVote


MASCOTS: tuple[dict[str, str], ...] = (
    {"symbol": "BTC", "coin": "Bitcoin", "title": "The Viking King"},
    {"symbol": "ETH", "coin": "Ethereum", "title": "The Sovereign"},
    {"symbol": "XRP", "coin": "XRP", "title": "The Velocity Guardian"},
    {"symbol": "SOL", "coin": "Solana", "title": "The Neon Ronin"},
    {"symbol": "BNB", "coin": "BNB", "title": "The Golden Architect"},
    {"symbol": "DOGE", "coin": "Dogecoin", "title": "The Lunar Captain"},
    {"symbol": "ADA", "coin": "Cardano", "title": "The Celestial Scholar"},
    {"symbol": "LINK", "coin": "Chainlink", "title": "The Oracle Sentinel"},
    {"symbol": "AVAX", "coin": "Avalanche", "title": "The Crimson Mountaineer"},
    {"symbol": "DOT", "coin": "Polkadot", "title": "The Multiverse Conductor"},
)
MASCOT_SYMBOLS = {item["symbol"] for item in MASCOTS}
SEED_POSITION = {item["symbol"]: index for index, item in enumerate(MASCOTS)}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _week_bounds(now: datetime) -> tuple[str, datetime, datetime]:
    now = _aware(now).astimezone(timezone.utc)
    start = datetime.combine((now - timedelta(days=now.weekday())).date(), time.min, tzinfo=timezone.utc)
    iso = start.isocalendar()
    return f"{iso.year}-W{iso.week:02d}", start, start + timedelta(days=7)


def _vote_counts(db: Session, round_id: int) -> dict[str, int]:
    rows = db.execute(
        select(MascotArenaVote.mascot_symbol, func.count(MascotArenaVote.id))
        .where(MascotArenaVote.round_id == round_id)
        .group_by(MascotArenaVote.mascot_symbol)
    ).all()
    return {symbol: int(count) for symbol, count in rows}


def _ordered_counts(counts: dict[str, int]) -> list[tuple[str, int]]:
    return sorted(
        ((item["symbol"], counts.get(item["symbol"], 0)) for item in MASCOTS),
        key=lambda item: (-item[1], SEED_POSITION[item[0]]),
    )


def _finalize(db: Session, round_: MascotArenaRound, now: datetime) -> None:
    ordered = _ordered_counts(_vote_counts(db, round_.id))
    total = sum(count for _, count in ordered)
    round_.champion_symbol = ordered[0][0] if total else ""
    round_.top_three_json = json.dumps(
        [{"symbol": symbol, "votes": count, "position": index + 1} for index, (symbol, count) in enumerate(ordered[:3])]
    )
    round_.status = "completed"
    round_.finalized_at = now


def ensure_current_round(db: Session, now: datetime | None = None) -> MascotArenaRound:
    now = _aware(now or utcnow())
    expired = db.execute(
        select(MascotArenaRound).where(
            MascotArenaRound.status == "active", MascotArenaRound.ends_at <= now
        ).order_by(MascotArenaRound.starts_at)
    ).scalars().all()
    for round_ in expired:
        _finalize(db, round_, now)
    if expired:
        db.commit()

    week_key, starts_at, ends_at = _week_bounds(now)
    current = db.execute(
        select(MascotArenaRound).where(MascotArenaRound.week_key == week_key)
    ).scalar_one_or_none()
    if current is not None:
        return current

    current = MascotArenaRound(
        week_key=week_key, status="active", starts_at=starts_at, ends_at=ends_at
    )
    db.add(current)
    try:
        db.commit()
        db.refresh(current)
        return current
    except IntegrityError:
        db.rollback()
        return db.execute(
            select(MascotArenaRound).where(MascotArenaRound.week_key == week_key)
        ).scalar_one()


def _hash(value: str) -> str:
    settings = get_settings()
    secret = settings.mascot_vote_secret or settings.jwt_secret or "aion-local-arena"
    return hashlib.sha256(f"{secret}:{value}".encode()).hexdigest()


def voter_hash(device_token: str, ip: str, user_agent: str) -> str:
    return _hash(f"device:{device_token}|ip:{ip}|ua:{user_agent[:256]}")


def ip_hash(ip: str) -> str:
    return _hash(f"ip:{ip}")


def _previous_positions(db: Session, current_id: int) -> dict[str, int]:
    previous = db.execute(
        select(MascotArenaRound)
        .where(MascotArenaRound.status == "completed", MascotArenaRound.id != current_id)
        .order_by(MascotArenaRound.ends_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if previous is None:
        return {}
    return {symbol: index + 1 for index, (symbol, _) in enumerate(_ordered_counts(_vote_counts(db, previous.id)))}


def arena_state(db: Session, *, voter: str | None = None, now: datetime | None = None) -> dict:
    now = _aware(now or utcnow())
    round_ = ensure_current_round(db, now)
    counts = _vote_counts(db, round_.id)
    ordered = _ordered_counts(counts)
    total = sum(count for _, count in ordered)
    previous = _previous_positions(db, round_.id)
    metadata = {item["symbol"]: item for item in MASCOTS}
    ranking = []
    for index, (symbol, count) in enumerate(ordered):
        position = index + 1
        old_position = previous.get(symbol, position)
        ranking.append({
            **metadata[symbol],
            "position": position,
            "votes": count,
            "percentage": round((count / total) * 100, 1) if total else 0.0,
            "movement": old_position - position,
        })

    completed = db.execute(
        select(MascotArenaRound)
        .where(MascotArenaRound.status == "completed", MascotArenaRound.champion_symbol != "")
        .order_by(MascotArenaRound.ends_at.desc())
        .limit(52)
    ).scalars().all()
    title_counts: dict[str, int] = {}
    for item in completed:
        title_counts[item.champion_symbol] = title_counts.get(item.champion_symbol, 0) + 1
    hall = []
    for item in completed:
        top_three = json.loads(item.top_three_json or "[]")
        winning_votes = next((entry["votes"] for entry in top_three if entry["symbol"] == item.champion_symbol), 0)
        hall.append({
            **metadata[item.champion_symbol],
            "week": item.week_key,
            "votes": winning_votes,
            "position": 1,
            "championships": title_counts[item.champion_symbol],
        })

    next_vote_at = None
    can_vote = True
    if voter:
        latest = db.execute(
            select(MascotArenaVote)
            .where(MascotArenaVote.round_id == round_.id, MascotArenaVote.voter_hash == voter)
            .order_by(MascotArenaVote.voted_at.desc())
            .limit(1)
        ).scalar_one_or_none()
        if latest:
            next_vote = _aware(latest.voted_at) + timedelta(hours=24)
            can_vote = next_vote <= now
            if not can_vote:
                next_vote_at = next_vote

    return {
        "round": {
            "id": round_.id,
            "week": round_.week_key,
            "starts_at": _aware(round_.starts_at),
            "ends_at": _aware(round_.ends_at),
            "status": round_.status,
            "total_votes": total,
        },
        "champion": ranking[0],
        "ranking": ranking,
        "hall_of_fame": hall,
        "can_vote": can_vote,
        "next_vote_at": next_vote_at,
    }


class VoteUnavailable(Exception):
    def __init__(self, message: str, *, next_vote_at: datetime | None = None) -> None:
        self.message = message
        self.next_vote_at = next_vote_at


def cast_vote(
    db: Session,
    *,
    symbol: str,
    device_token: str,
    client_ip: str,
    user_agent: str,
    source: str,
    now: datetime | None = None,
) -> dict:
    now = _aware(now or utcnow())
    symbol = symbol.upper()
    if symbol not in MASCOT_SYMBOLS:
        raise ValueError("unknown mascot")
    round_ = ensure_current_round(db, now)
    voter = voter_hash(device_token, client_ip, user_agent)
    ip = ip_hash(client_ip)
    latest = db.execute(
        select(MascotArenaVote)
        .where(MascotArenaVote.round_id == round_.id, MascotArenaVote.voter_hash == voter)
        .order_by(MascotArenaVote.voted_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if latest and _aware(latest.voted_at) + timedelta(hours=24) > now:
        raise VoteUnavailable("Next vote is not available yet", next_vote_at=_aware(latest.voted_at) + timedelta(hours=24))

    ip_votes = db.execute(
        select(func.count(MascotArenaVote.id)).where(
            MascotArenaVote.ip_hash == ip,
            MascotArenaVote.voted_at >= now - timedelta(hours=24),
        )
    ).scalar_one()
    if ip_votes >= get_settings().mascot_vote_ip_daily_limit:
        raise VoteUnavailable("Voting limit reached for this network")

    db.add(MascotArenaVote(
        round_id=round_.id,
        mascot_symbol=symbol,
        voter_hash=voter,
        ip_hash=ip,
        vote_day=now.date().isoformat(),
        source=(source or "arena")[:120],
        voted_at=now,
    ))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise VoteUnavailable("Vote already counted for this period") from None
    return arena_state(db, voter=voter, now=now)
