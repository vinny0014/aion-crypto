"""Weekly Mascot Arena competition and privacy-preserving vote accounting."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Article, MascotArenaRound, MascotArenaVote


ACTIVE_MASCOT_COUNT = 15
HISTORICAL_ROSTER_COUNTS = frozenset((10, ACTIVE_MASCOT_COUNT))

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
    {"symbol": "SHIB", "coin": "Shiba Inu", "title": "The Shiba Sentinel"},
    {"symbol": "PEPE", "coin": "Pepe", "title": "The Meme Trickster"},
    {"symbol": "HYPE", "coin": "Hyperliquid", "title": "The Perpetual Warden"},
    {"symbol": "TRX", "coin": "TRON", "title": "The Network Regent"},
    {"symbol": "SUI", "coin": "Sui", "title": "The Tidal Blade"},
)
RESERVE_MASCOTS: tuple[dict[str, str], ...] = (
    {"symbol": "TON", "coin": "Toncoin", "title": "The Network Voyager"},
    {"symbol": "MATIC", "coin": "Polygon", "title": "The Purple Pathfinder"},
    {"symbol": "ATOM", "coin": "Cosmos", "title": "The Cosmos Navigator"},
    {"symbol": "NEAR", "coin": "NEAR Protocol", "title": "The Horizon Keeper"},
    {"symbol": "APT", "coin": "Aptos", "title": "The Parallel Vanguard"},
    {"symbol": "ARB", "coin": "Arbitrum", "title": "The Layer Guardian"},
    {"symbol": "INJ", "coin": "Injective", "title": "The Exchange Warden"},
    {"symbol": "LTC", "coin": "Litecoin", "title": "The Silver Ranger"},
    {"symbol": "UNI", "coin": "Uniswap", "title": "The Liquidity Alchemist"},
)
ALL_MASCOTS = (*MASCOTS, *RESERVE_MASCOTS)
MASCOT_SYMBOLS = {item["symbol"] for item in ALL_MASCOTS}
STARTING_ROSTER = [item["symbol"] for item in MASCOTS]
STARTING_RESERVE = [item["symbol"] for item in RESERVE_MASCOTS]


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


def _symbols(value: str, fallback: list[str]) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
    except (TypeError, ValueError):
        return list(fallback)
    valid = [symbol for symbol in parsed if isinstance(symbol, str) and symbol in MASCOT_SYMBOLS]
    return valid if len(valid) == len(set(valid)) and valid else list(fallback)


def _round_roster(round_: MascotArenaRound) -> list[str]:
    roster = _symbols(round_.roster_json, STARTING_ROSTER)
    # Completed Top 10 rounds remain valid historical records. New rounds are
    # always created with ACTIVE_MASCOT_COUNT entrants.
    return roster if len(roster) in HISTORICAL_ROSTER_COUNTS else list(STARTING_ROSTER)


def _round_reserve(round_: MascotArenaRound) -> list[str]:
    roster = set(_round_roster(round_))
    reserve = [symbol for symbol in _symbols(round_.reserve_json, STARTING_RESERVE) if symbol not in roster]
    missing = [item["symbol"] for item in ALL_MASCOTS if item["symbol"] not in roster and item["symbol"] not in reserve]
    return [*reserve, *missing]


def _ordered_counts(counts: dict[str, int], roster: list[str]) -> list[tuple[str, int]]:
    seed_position = {symbol: index for index, symbol in enumerate(roster)}
    return sorted(
        ((symbol, counts.get(symbol, 0)) for symbol in roster),
        key=lambda item: (-item[1], seed_position[item[0]]),
    )


def _finalize(db: Session, round_: MascotArenaRound, now: datetime) -> None:
    roster = _round_roster(round_)
    reserve = _round_reserve(round_)
    ordered = _ordered_counts(_vote_counts(db, round_.id), roster)
    round_.champion_symbol = ordered[0][0]
    round_.top_three_json = json.dumps(
        [{"symbol": symbol, "votes": count, "position": index + 1} for index, (symbol, count) in enumerate(ordered[:3])]
    )
    round_.status = "completed"
    round_.finalized_at = now
    if reserve:
        round_.relegated_symbol = ordered[-1][0]
        round_.promoted_symbol = reserve[0]
        next_roster = [symbol for symbol, _count in ordered if symbol != round_.relegated_symbol]
        next_roster.append(round_.promoted_symbol)
        round_.next_roster_json = json.dumps(next_roster)
        round_.next_reserve_json = json.dumps([*reserve[1:], round_.relegated_symbol])


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

    previous = db.execute(
        select(MascotArenaRound)
        .where(MascotArenaRound.status == "completed")
        .order_by(MascotArenaRound.ends_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    roster = _symbols(previous.next_roster_json, STARTING_ROSTER) if previous else list(STARTING_ROSTER)
    # A completed Top 10 round remains readable but cannot constrain the new
    # Top 15 format. This does not update the historical row or its votes.
    if len(roster) != ACTIVE_MASCOT_COUNT:
        roster = list(STARTING_ROSTER)
    if previous:
        reserve = _symbols(previous.next_reserve_json, STARTING_RESERVE)
        reserve = [symbol for symbol in reserve if symbol not in roster]
        reserve.extend(
            item["symbol"] for item in ALL_MASCOTS
            if item["symbol"] not in roster and item["symbol"] not in reserve
        )
    else:
        reserve = list(STARTING_RESERVE)
    current = MascotArenaRound(
        week_key=week_key, status="active", starts_at=starts_at, ends_at=ends_at,
        roster_json=json.dumps(roster), reserve_json=json.dumps(reserve),
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
    return {
        symbol: index + 1
        for index, (symbol, _) in enumerate(_ordered_counts(_vote_counts(db, previous.id), _round_roster(previous)))
    }


def _latest_news(db: Session, symbols: list[str]) -> dict[str, dict]:
    articles = db.execute(
        select(Article).where(
            Article.related_asset.in_(symbols),
            Article.status.in_(("published", "updated")),
            Article.published_at.is_not(None), Article.is_fixture.is_(False),
        ).order_by(Article.published_at.desc()).limit(100)
    ).scalars()
    result: dict[str, dict] = {}
    for article in articles:
        if article.related_asset not in result:
            result[article.related_asset] = {
                "slug": article.slug, "title": article.title,
                "published_at": _aware(article.published_at),
            }
    return result


def arena_state(db: Session, *, voter: str | None = None, now: datetime | None = None) -> dict:
    now = _aware(now or utcnow())
    round_ = ensure_current_round(db, now)
    roster = _round_roster(round_)
    reserve = _round_reserve(round_)
    counts = _vote_counts(db, round_.id)
    ordered = _ordered_counts(counts, roster)
    total = sum(count for _, count in ordered)
    previous = _previous_positions(db, round_.id)
    metadata = {item["symbol"]: item for item in ALL_MASCOTS}
    latest_news = _latest_news(db, [item["symbol"] for item in ALL_MASCOTS])
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
            "latest_news": latest_news.get(symbol),
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
        completed_total = sum(_vote_counts(db, item.id).values())
        hall.append({
            **metadata[item.champion_symbol],
            "week": item.week_key,
            "votes": winning_votes,
            "position": 1,
            "percentage": round((winning_votes / completed_total) * 100, 1) if completed_total else 0.0,
            "movement": 0,
            "latest_news": latest_news.get(item.champion_symbol),
            "championships": title_counts[item.champion_symbol],
        })

    latest_completed = completed[0] if completed else None
    mascot_of_week = None
    if latest_completed:
        winning = json.loads(latest_completed.top_three_json or "[]")
        winning_votes = next((entry["votes"] for entry in winning if entry["symbol"] == latest_completed.champion_symbol), 0)
        winning_total = sum(_vote_counts(db, latest_completed.id).values())
        mascot_of_week = {
            **metadata[latest_completed.champion_symbol], "position": 1,
            "votes": winning_votes, "week": latest_completed.week_key,
            "percentage": round((winning_votes / winning_total) * 100, 1) if winning_total else 0.0,
            "movement": 0,
            "latest_news": latest_news.get(latest_completed.champion_symbol),
        }

    next_vote_at = None
    can_vote = True
    if voter:
        latest = db.execute(
            select(MascotArenaVote)
            .where(MascotArenaVote.voter_hash == voter)
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
        "mascot_of_week": mascot_of_week,
        "ranking": ranking,
        "hall_of_fame": hall,
        "next_challenger": metadata[reserve[0]] if reserve else None,
        "last_rotation": ({
            "relegated": metadata[latest_completed.relegated_symbol],
            "promoted": metadata[latest_completed.promoted_symbol],
            "week": latest_completed.week_key,
        } if latest_completed and latest_completed.relegated_symbol and latest_completed.promoted_symbol else None),
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
    if symbol not in _round_roster(round_):
        raise ValueError("mascot is not active in this round")
    voter = voter_hash(device_token, client_ip, user_agent)
    ip = ip_hash(client_ip)
    latest = db.execute(
        select(MascotArenaVote)
        .where(MascotArenaVote.voter_hash == voter)
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
