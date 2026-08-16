"""Original, source-bound daily market brief generated from live public data."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Article, BreakingCampaign
from app.pipeline.editorial import EditorialPipeline
from app.pipeline.registry import AGENTS
from app.services.market import DEFAULT_TICKER_SYMBOLS, MarketService


def _usd(value: float) -> str:
    if abs(value) >= 1_000:
        return f"${value:,.2f}"
    if abs(value) >= 1:
        return f"${value:,.4f}".rstrip("0").rstrip(".")
    return f"${value:,.6f}".rstrip("0").rstrip(".")


def build_market_brief(rows: list[dict], captured_at: datetime, source: str) -> dict:
    """Build prose only from numeric fields present in a live provider payload."""
    if len(rows) < 5:
        raise ValueError("at least five live market rows are required")
    day = captured_at.astimezone(timezone.utc)
    day_label = day.strftime("%B %-d, %Y")
    slug_day = day.strftime("%Y-%m-%d")
    leaders = sorted(rows, key=lambda row: float(row["change_24h_pct"]), reverse=True)
    leader, laggard = leaders[0], leaders[-1]
    details = []
    for row in rows:
        change = float(row["change_24h_pct"])
        direction = "higher" if change > 0 else "lower" if change < 0 else "unchanged"
        details.append(
            f"{row['name']} ({row['symbol']}) was {_usd(float(row['price']))}, "
            f"{direction} by {abs(change):.2f}% over 24 hours. Its reported session range was "
            f"{_usd(float(row['low_24h']))} to {_usd(float(row['high_24h']))}, with "
            f"{_usd(float(row['volume_24h_quote']))} in quote-asset volume."
        )
    body = (
        f"AION Crypto recorded this daily market snapshot at {day.strftime('%H:%M')} UTC on {day_label} "
        f"from {source} public market data. The figures describe the provider's rolling 24-hour window "
        "at capture time; they are not closing prices and will change as new trades enter the window.\n\n"
        + "\n\n".join(details)
        + f"\n\nWithin this group, {leader['symbol']} had the strongest reported 24-hour percentage move "
        f"at {float(leader['change_24h_pct']):+.2f}%, while {laggard['symbol']} had the weakest at "
        f"{float(laggard['change_24h_pct']):+.2f}%. This is a mechanical comparison of the captured "
        "provider values, not an explanation of cause or a forecast. Differences in liquidity and "
        "volatility mean percentage moves and quote volume are not directly interchangeable across assets.\n\n"
        "Provider timestamps, availability and venue coverage can differ from other market services. "
        "AION Crypto publishes this brief only from a live response and does not substitute development "
        "fixtures or stale cached values. Readers should check the current market page before relying on "
        "any number shown in this time-stamped record."
    )
    return {
        "title": f"Daily crypto market snapshot for {day_label}",
        "summary": (
            f"A time-stamped view of BTC, ETH and major crypto assets, led by "
            f"{leader['symbol']} at {float(leader['change_24h_pct']):+.2f}% over 24 hours in the captured data."
        ),
        "body": body,
        "slug": f"daily-crypto-market-snapshot-{slug_day}",
        "source_fragment": slug_day,
    }


async def _fetch_live_snapshot() -> tuple[list[dict], str]:
    service = MarketService()
    try:
        result = await service.get_ticker(DEFAULT_TICKER_SYMBOLS)
    finally:
        await service.close()
    if result.get("status") != "live" or result.get("stale") or not result.get("source"):
        raise ValueError("live market data is unavailable; daily brief remains unpublished")
    return result.get("data") or [], str(result["source"])


def publish_daily_market_brief(db: Session, now: datetime | None = None) -> dict:
    captured_at = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    slug = f"daily-crypto-market-snapshot-{captured_at:%Y-%m-%d}"
    existing = db.execute(select(Article).where(Article.slug == slug)).scalar_one_or_none()
    if existing is not None:
        return {"article_id": existing.id, "status": existing.status, "created": False}

    rows, source = asyncio.run(_fetch_live_snapshot())
    brief = build_market_brief(rows, captured_at, source)
    settings = get_settings()
    if source == "binance":
        evidence_url = f"{settings.binance_base_url}/api/v3/ticker/24hr#{brief['source_fragment']}"
    elif source == "coingecko":
        evidence_url = f"{settings.coingecko_base_url}/coins/markets#{brief['source_fragment']}"
    else:
        raise ValueError("unsupported market data source")

    pipeline = EditorialPipeline(db)
    article = pipeline.create_detected(
        title=brief["title"], summary=brief["summary"], body=brief["body"],
        category="Market Analysis", priority="normal", source_urls=[evidence_url],
        source_name=f"{source.title()} public market data", related_asset="BTC",
        source_published_at=captured_at,
    )
    article.slug = brief["slug"]
    db.add(BreakingCampaign(
        article_id=article.id, provisional_title=article.title,
        fact_summary=article.summary, notes=article.body, primary_source=evidence_url,
        additional_sources_json="[]", related_asset="BTC", category="Market Analysis",
        urgency="normal", language="en", publish_action="publish",
        prepare_social=True, daily_candidate=True, status="queued",
    ))
    db.commit()
    for agent in AGENTS:
        result = pipeline.run_agent(agent, article.id)
        if not result.get("advance", True):
            break
        if result["status"] in {"duplicate", "rejected", "compliance_failed", "failed", "archived"}:
            break
    db.refresh(article)
    if article.status != "published":
        raise ValueError(f"daily market brief failed editorial gates: {article.status}")
    return {"article_id": article.id, "status": article.status, "created": True}
