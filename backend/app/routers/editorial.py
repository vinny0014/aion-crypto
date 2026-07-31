import csv
import hashlib
import io
import json
import secrets
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import Article, BreakingCampaign, SocialOutbox, Source, Subscriber, SubscriberPreference
from app.pipeline.editorial import CATEGORIES, PRIORITIES, EditorialPipeline
from app.pipeline.registry import AGENTS, build_commander
from app.routers.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["editorial"])
PREFERENCES = {"Breaking News", "Daily Summary", "Bitcoin", "Ethereum", "XRP", "Altcoins", "ETFs", "Regulation", "Security"}


class BreakingInput(BaseModel):
    provisional_title: str = Field(min_length=12, max_length=300)
    fact_summary: str = Field(min_length=20, max_length=3000)
    notes: str = Field(default="", max_length=20000)
    primary_source: str = Field(max_length=800)
    additional_sources: list[str] = Field(default_factory=list, max_length=8)
    related_asset: str = Field(default="", max_length=30)
    category: str = "Market Analysis"
    image_url: str = Field(default="", max_length=800)
    urgency: str = "normal"
    language: str = Field(default="en", max_length=10)
    action: str = Field(default="review", pattern="^(publish|review|draft)$")
    prepare_social: bool = True
    daily_candidate: bool = False


class SubscribeInput(BaseModel):
    email: EmailStr
    consent: bool
    preferences: list[str] = Field(default_factory=list, min_length=1, max_length=9)
    source: str = Field(default="website", max_length=200)
    website: str = Field(default="", max_length=200)


class SourceInput(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    url: str = Field(max_length=500)
    kind: str = Field(default="rss", pattern="^(rss|atom|regulatory|official|exchange)$")


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def article_payload(article: Article) -> dict:
    return {
        "id": article.id, "slug": article.slug, "title": article.title,
        "subtitle": article.subtitle, "summary": article.summary, "body": article.body,
        "category": article.category, "tags": [x for x in article.tags.split(",") if x],
        "related_asset": article.related_asset, "priority": article.priority,
        "image_url": article.image_url, "sources": json.loads(article.sources_json or "[]"),
        "source_name": article.source_name, "source_published_at": article.source_published_at,
        "author": article.author_name, "canonical": article.canonical_url,
        "published_at": article.published_at, "updated_at": article.updated_at,
    }


@router.get("/articles")
def published_articles(limit: int = 30, db: Session = Depends(get_db)):
    rows = db.execute(select(Article).where(
        Article.status.in_(("published", "updated")),
        Article.published_at.is_not(None),
        Article.is_fixture.is_(False),
    ).order_by(Article.published_at.desc()).limit(min(max(limit, 1), 100))).scalars()
    return {"data": [article_payload(row) for row in rows]}


@router.get("/articles/{slug}")
def published_article(slug: str, db: Session = Depends(get_db)):
    article = db.execute(select(Article).where(
        Article.slug == slug,
        Article.status.in_(("published", "updated")),
        Article.published_at.is_not(None),
        Article.is_fixture.is_(False),
    )).scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="article not found")
    return {"data": article_payload(article)}


@router.post("/admin/breaking", status_code=201)
def create_breaking(payload: BreakingInput, db: Session = Depends(get_db), _=Depends(require_role("admin", "editor"))):
    if payload.category not in CATEGORIES or payload.urgency not in PRIORITIES:
        raise HTTPException(status_code=422, detail="unsupported category or urgency")
    campaign = BreakingCampaign(
        provisional_title=payload.provisional_title, fact_summary=payload.fact_summary,
        notes=payload.notes, primary_source=payload.primary_source,
        additional_sources_json=json.dumps(payload.additional_sources), related_asset=payload.related_asset,
        category=payload.category, image_url=payload.image_url, urgency=payload.urgency,
        language=payload.language, publish_action=payload.action, prepare_social=payload.prepare_social,
        daily_candidate=payload.daily_candidate,
    )
    db.add(campaign)
    db.flush()
    try:
        article = EditorialPipeline(db).create_detected(
            title=payload.provisional_title, summary=payload.fact_summary, body=payload.notes,
            category=payload.category, priority=payload.urgency,
            source_urls=[payload.primary_source, *payload.additional_sources],
            source_name=urlparse(payload.primary_source).hostname or "",
            related_asset=payload.related_asset, language=payload.language,
            reject_duplicate=True,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    campaign.article_id = article.id
    campaign.status = "queued"
    db.commit()
    if payload.action != "draft":
        build_commander(db).enqueue("radar", {"article_id": article.id}, idempotency_key=f"article:{article.id}:radar")
    return {"campaign_id": campaign.id, "article_id": article.id, "status": article.status, "automatic_ads": False}


@router.post("/admin/pipeline/run")
def run_pipeline(db: Session = Depends(get_db), _=Depends(require_role("admin", "editor"))):
    return build_commander(db).run_cycle()


@router.post("/admin/sources", status_code=201)
def create_source(payload: SourceInput, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    from app.pipeline.editorial import valid_public_url
    if not valid_public_url(payload.url):
        raise HTTPException(status_code=422, detail="source must be a public HTTPS URL")
    existing = db.execute(select(Source).where(Source.url == payload.url)).scalar_one_or_none()
    if existing:
        return {"id": existing.id, "status": "exists"}
    source = Source(name=payload.name, url=payload.url, kind=payload.kind, trusted=True, active=True)
    db.add(source)
    db.commit()
    return {"id": source.id, "status": "active"}


@router.post("/admin/sources/{source_id}/scan", status_code=202)
def queue_source_scan(source_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin", "editor"))):
    source = db.get(Source, source_id)
    if source is None or not source.active:
        raise HTTPException(status_code=404, detail="active source not found")
    commander = build_commander(db)
    hour_bucket = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    task = commander.enqueue("source-scan", {"source_id": source.id}, idempotency_key=f"source:{source.id}:{hour_bucket}")
    return {"task_id": task.id, "status": task.status}


@router.get("/admin/editorial-dashboard")
def editorial_dashboard(db: Session = Depends(get_db), _=Depends(require_role("admin", "editor"))):
    pipeline = EditorialPipeline(db)
    source_count = db.execute(select(func.count()).select_from(Article)).scalar_one()
    return {
        **pipeline.metrics(), "daily_candidates": pipeline.daily_candidates(),
        "agents": {"status": "connected", "registered": list(AGENTS)},
        "scheduler": {"status": "not_configured"},
        "published_source_records": source_count,
        "analytics": {"status": "available_internal", "google_analytics": "not_connected", "search_console": "not_connected"},
    }


@router.get("/admin/social-outbox")
def social_outbox(db: Session = Depends(get_db), _=Depends(require_role("admin", "editor"))):
    rows = db.execute(select(SocialOutbox).order_by(SocialOutbox.created_at.desc()).limit(200)).scalars()
    return {"data": [{"id": row.id, "article_id": row.article_id, "channel": row.channel, "payload": json.loads(row.payload_json), "utm_url": row.utm_url, "status": row.status, "last_error": row.last_error} for row in rows]}


@router.post("/audience/subscribe", status_code=status.HTTP_202_ACCEPTED)
def subscribe(payload: SubscribeInput, db: Session = Depends(get_db)):
    if not payload.consent:
        raise HTTPException(status_code=422, detail="explicit consent is required")
    if payload.website:
        return {"status": "pending_confirmation", "message": "Check your email when confirmation delivery is connected."}
    preferences = list(dict.fromkeys(payload.preferences))
    if any(item not in PREFERENCES for item in preferences):
        raise HTTPException(status_code=422, detail="unsupported preference")
    email = payload.email.lower().strip()
    subscriber = db.execute(select(Subscriber).where(Subscriber.email == email)).scalar_one_or_none()
    raw_confirmation = secrets.token_urlsafe(32)
    raw_unsubscribe = secrets.token_urlsafe(32)
    if subscriber is None:
        subscriber = Subscriber(email=email)
        db.add(subscriber)
        db.flush()
    subscriber.consent = True
    subscriber.unsubscribed = False
    subscriber.source = payload.source
    subscriber.consent_at = datetime.now(timezone.utc)
    subscriber.confirmation_token_hash = _hash(raw_confirmation)
    subscriber.unsubscribe_token_hash = _hash(raw_unsubscribe)
    db.query(SubscriberPreference).filter(SubscriberPreference.subscriber_id == subscriber.id).delete()
    for preference in preferences:
        db.add(SubscriberPreference(subscriber_id=subscriber.id, category=preference))
    db.commit()
    response = {"status": "pending_confirmation", "message": "Check your email when confirmation delivery is connected."}
    if get_settings().app_env == "development":
        response["development_confirmation_token"] = raw_confirmation
    return response


@router.post("/audience/confirm/{token}")
def confirm_subscription(token: str, db: Session = Depends(get_db)):
    subscriber = db.execute(select(Subscriber).where(Subscriber.confirmation_token_hash == _hash(token))).scalar_one_or_none()
    if subscriber is None:
        raise HTTPException(status_code=404, detail="confirmation token not found")
    subscriber.confirmed = True
    subscriber.confirmed_at = datetime.now(timezone.utc)
    subscriber.confirmation_token_hash = ""
    db.commit()
    return {"status": "confirmed"}


@router.post("/audience/unsubscribe/{token}")
def unsubscribe(token: str, db: Session = Depends(get_db)):
    subscriber = db.execute(select(Subscriber).where(Subscriber.unsubscribe_token_hash == _hash(token))).scalar_one_or_none()
    if subscriber is None:
        raise HTTPException(status_code=404, detail="unsubscribe token not found")
    subscriber.unsubscribed = True
    subscriber.unsubscribed_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "unsubscribed"}


@router.get("/admin/audience/export.csv")
def export_audience(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["email", "confirmed", "unsubscribed", "source", "consent_at"])
    for row in db.execute(select(Subscriber).order_by(Subscriber.created_at)).scalars():
        writer.writerow([row.email, row.confirmed, row.unsubscribed, row.source, row.consent_at.isoformat() if row.consent_at else ""])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=aion-crypto-audience.csv"})
