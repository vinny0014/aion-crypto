"""Database models — foundation schema for the editorial pipeline,
users, watchlist, newsletter, cost ledger and task queue."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="viewer")  # admin|editor|viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class RefreshSession(Base):
    """Server-side record for a rotating refresh token (the token itself is never stored)."""
    __tablename__ = "refresh_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Source(Base):
    __tablename__ = "sources"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(500), unique=True)
    kind: Mapped[str] = mapped_column(String(50), default="rss")  # rss|blog|regulatory|github|exchange
    trusted: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(300), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    subtitle: Mapped[str] = mapped_column(String(500), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    body: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100), default="news", index=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    related_asset: Mapped[str] = mapped_column(String(30), default="")
    priority: Mapped[str] = mapped_column(String(20), default="normal", index=True)
    tags: Mapped[str] = mapped_column(String(500), default="")  # comma-separated
    image_url: Mapped[str] = mapped_column(String(600), default="")
    image_status: Mapped[str] = mapped_column(String(30), default="pending")  # pending|validated|failed
    source_url: Mapped[str] = mapped_column(String(600), default="")
    source_name: Mapped[str] = mapped_column(String(200), default="")
    source_published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sources_json: Mapped[str] = mapped_column(Text, default="[]")
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    is_fixture: Mapped[bool] = mapped_column(Boolean, default=False)
    content_hash: Mapped[str] = mapped_column(String(64), index=True, default="")
    status: Mapped[str] = mapped_column(String(30), default="detected", index=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    compliance_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    originality_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    seo_title: Mapped[str] = mapped_column(String(300), default="")
    seo_description: Mapped[str] = mapped_column(String(320), default="")
    canonical_url: Mapped[str] = mapped_column(String(600), default="")
    author_name: Mapped[str] = mapped_column(String(120), default="AION Crypto")
    rejection_reason: Mapped[str] = mapped_column(Text, default="")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(50), index=True)  # discovery|content|verify|image|publish|monitor
    idempotency_key: Mapped[str | None] = mapped_column(String(128), unique=True, index=True, nullable=True)
    payload: Mapped[str] = mapped_column(Text, default="{}")
    status: Mapped[str] = mapped_column(String(30), default="queued", index=True)  # queued|running|done|failed|dead
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3)
    last_error: Mapped[str] = mapped_column(Text, default="")
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SchedulerRun(Base):
    """Auditable scheduler lease and outcome; only one run may be active."""
    __tablename__ = "scheduler_runs"
    id: Mapped[int] = mapped_column(primary_key=True)
    run_key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="running", index=True)
    trigger: Mapped[str] = mapped_column(String(20), default="scheduled")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sources_scanned: Mapped[int] = mapped_column(Integer, default=0)
    items_seen: Mapped[int] = mapped_column(Integer, default=0)
    articles_detected: Mapped[int] = mapped_column(Integer, default=0)
    duplicates_rejected: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str] = mapped_column(Text, default="")


class CostLedgerEntry(Base):
    __tablename__ = "cost_ledger"
    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100), default="")
    agent: Mapped[str] = mapped_column(String(100), default="")
    task: Mapped[str] = mapped_column(String(200), default="")
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    images: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    result: Mapped[str] = mapped_column(String(50), default="ok")
    retries: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class Subscriber(Base):
    __tablename__ = "subscribers"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    consent: Mapped[bool] = mapped_column(Boolean, default=False)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)  # double opt-in
    unsubscribed: Mapped[bool] = mapped_column(Boolean, default=False)
    segment: Mapped[str] = mapped_column(String(100), default="weekly")
    source: Mapped[str] = mapped_column(String(200), default="website")
    confirmation_token_hash: Mapped[str] = mapped_column(String(64), default="")
    unsubscribe_token_hash: Mapped[str] = mapped_column(String(64), default="")
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unsubscribed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"
    __table_args__ = (UniqueConstraint("user_id", "symbol", name="uq_watchlist_items_user_symbol"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Incident(Base):
    __tablename__ = "incidents"
    id: Mapped[int] = mapped_column(primary_key=True)
    component: Mapped[str] = mapped_column(String(100), index=True)
    severity: Mapped[str] = mapped_column(String(20), default="warning")  # info|warning|critical
    message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="open", index=True)  # open|recovering|resolved
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SubscriberPreference(Base):
    __tablename__ = "subscriber_preferences"
    __table_args__ = (UniqueConstraint("subscriber_id", "category", name="uq_subscriber_preference"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    subscriber_id: Mapped[int] = mapped_column(ForeignKey("subscribers.id"), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EditorialEvent(Base):
    __tablename__ = "editorial_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    article_id: Mapped[int | None] = mapped_column(ForeignKey("articles.id"), nullable=True, index=True)
    agent: Mapped[str] = mapped_column(String(50), index=True)
    from_state: Mapped[str] = mapped_column(String(30), default="")
    to_state: Mapped[str] = mapped_column(String(30), index=True)
    result: Mapped[str] = mapped_column(String(30), default="ok")
    reason: Mapped[str] = mapped_column(Text, default="")
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class SocialOutbox(Base):
    __tablename__ = "social_outbox"
    __table_args__ = (UniqueConstraint("article_id", "channel", name="uq_social_outbox_article_channel"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id"), index=True)
    channel: Mapped[str] = mapped_column(String(30), index=True)
    payload_json: Mapped[str] = mapped_column(Text, default="{}")
    utm_url: Mapped[str] = mapped_column(String(800), default="")
    status: Mapped[str] = mapped_column(String(30), default="prepared", index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class BreakingCampaign(Base):
    __tablename__ = "breaking_campaigns"
    id: Mapped[int] = mapped_column(primary_key=True)
    provisional_title: Mapped[str] = mapped_column(String(300))
    fact_summary: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    primary_source: Mapped[str] = mapped_column(String(800))
    additional_sources_json: Mapped[str] = mapped_column(Text, default="[]")
    related_asset: Mapped[str] = mapped_column(String(30), default="")
    category: Mapped[str] = mapped_column(String(100), default="Market Analysis")
    image_url: Mapped[str] = mapped_column(String(800), default="")
    urgency: Mapped[str] = mapped_column(String(20), default="normal")
    language: Mapped[str] = mapped_column(String(10), default="en")
    publish_action: Mapped[str] = mapped_column(String(30), default="review")
    prepare_social: Mapped[bool] = mapped_column(Boolean, default=True)
    daily_candidate: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    article_id: Mapped[int | None] = mapped_column(ForeignKey("articles.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
