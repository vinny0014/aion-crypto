"""Cost Guard — hard monthly ceiling for paid API usage.

Bands (relative to TOTAL_API_MONTHLY_LIMIT_USD, default $10):
    < $7          NORMAL          all paid tasks allowed
    $7 – <$9      ECONOMY         only medium/high priority paid tasks
    $9 – <$10     ESSENTIAL_ONLY  only essential paid tasks
    >= $10        BLOCKED         no paid calls at all

Free operations (health checks, monitoring, scheduler, price data via
public APIs, logs, sitemaps, RSS, analytics, simple validations) must
NEVER be routed through paid calls — that is enforced by callers using
`ensure_allowed()` only for paid providers.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import CostLedgerEntry


class Band(str, Enum):
    NORMAL = "NORMAL"
    ECONOMY = "ECONOMY"
    ESSENTIAL_ONLY = "ESSENTIAL_ONLY"
    BLOCKED = "BLOCKED"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    ESSENTIAL = "essential"


_BAND_ALLOWS: dict[Band, set[Priority]] = {
    Band.NORMAL: {Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.ESSENTIAL},
    Band.ECONOMY: {Priority.MEDIUM, Priority.HIGH, Priority.ESSENTIAL},
    Band.ESSENTIAL_ONLY: {Priority.ESSENTIAL},
    Band.BLOCKED: set(),
}


class CostGuard:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.limit = get_settings().total_api_monthly_limit_usd

    def month_spend_usd(self, now: datetime | None = None) -> float:
        now = now or datetime.now(timezone.utc)
        start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        total = self.session.execute(
            select(func.coalesce(func.sum(CostLedgerEntry.cost_usd), 0.0)).where(
                CostLedgerEntry.created_at >= start
            )
        ).scalar_one()
        return float(total)

    def band(self, now: datetime | None = None) -> Band:
        spend = self.month_spend_usd(now)
        if spend >= self.limit:
            return Band.BLOCKED
        if spend >= self.limit * 0.9:
            return Band.ESSENTIAL_ONLY
        if spend >= self.limit * 0.7:
            return Band.ECONOMY
        return Band.NORMAL

    def ensure_allowed(self, priority: Priority, now: datetime | None = None) -> None:
        """Raise before any paid call that the current band does not allow."""
        current = self.band(now)
        if priority not in _BAND_ALLOWS[current]:
            raise CostBlockedError(
                f"Paid call with priority '{priority.value}' blocked: band={current.value}, "
                f"spend=${self.month_spend_usd(now):.2f}/{self.limit:.2f}"
            )

    def record(
        self,
        *,
        provider: str,
        model: str,
        agent: str,
        task: str,
        cost_usd: float,
        tokens_in: int = 0,
        tokens_out: int = 0,
        images: int = 0,
        result: str = "ok",
        retries: int = 0,
    ) -> CostLedgerEntry:
        entry = CostLedgerEntry(
            provider=provider,
            model=model,
            agent=agent,
            task=task,
            cost_usd=cost_usd,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            images=images,
            result=result,
            retries=retries,
        )
        self.session.add(entry)
        self.session.commit()
        return entry

    def summary(self) -> dict:
        spend = self.month_spend_usd()
        return {
            "month_spend_usd": round(spend, 4),
            "monthly_limit_usd": self.limit,
            "band": self.band().value,
            "remaining_usd": round(max(self.limit - spend, 0.0), 4),
        }


class CostBlockedError(RuntimeError):
    pass
