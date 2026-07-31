"""Deterministic editorial gates for AION Crypto.

The module intentionally performs no paid or generative call. It turns sourced
operator/RSS input into auditable drafts and only publishes when every explicit
gate passes. A future writing provider must enter through CostGuard and remain
disabled by default.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlparse

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Article, BreakingCampaign, EditorialEvent, SocialOutbox

STATES = (
    "detected", "normalized", "duplicate", "verifying", "verified", "rejected",
    "drafting", "reviewing", "compliance_failed", "ready", "published", "updated",
    "archived", "failed",
)
CATEGORIES = {
    "Bitcoin", "Ethereum", "XRP", "Altcoins", "ETFs", "DeFi", "Regulation",
    "Security", "Exchanges", "Institutional", "Market Analysis", "Blockchain Technology",
}
PRIORITIES = {"breaking", "high", "normal", "evergreen", "rejected"}
CHANNELS = ("telegram", "discord", "facebook", "instagram", "linkedin")
BLOCKED_PHRASES = (
    "guaranteed profit", "risk-free profit", "cannot lose", "buy now", "sell now",
    "we interviewed", "our reporter witnessed",
)
TITLE_STOPWORDS = {
    "about", "after", "before", "from", "into", "market", "news", "that", "their",
    "this", "with", "will", "crypto", "cryptocurrency", "publishes", "published",
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:280] or hashlib.sha256(value.encode()).hexdigest()[:20]


def valid_public_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.hostname) and parsed.hostname not in {"localhost", "127.0.0.1"}


class DuplicateArticleError(ValueError):
    def __init__(self, article_id: int) -> None:
        super().__init__(f"duplicate article detected (existing article #{article_id})")
        self.article_id = article_id


class EditorialPipeline:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()

    def record(self, article: Article, agent: str, to_state: str, *, result: str = "ok", reason: str = "", evidence: list | None = None) -> None:
        previous = article.status
        article.status = to_state
        self.db.add(EditorialEvent(
            article_id=article.id, agent=agent, from_state=previous, to_state=to_state,
            result=result, reason=reason, evidence_json=json.dumps(evidence or []),
        ))

    def create_detected(self, *, title: str, summary: str, body: str, category: str,
                        priority: str, source_urls: list[str], source_name: str = "",
                        related_asset: str = "", language: str = "en",
                        source_published_at: datetime | None = None,
                        is_fixture: bool = False,
                        reject_duplicate: bool = False) -> Article:
        title = " ".join(title.split()).strip()
        if len(title) < 12:
            raise ValueError("title must contain at least 12 characters")
        if category not in CATEGORIES:
            raise ValueError("unsupported category")
        if priority not in PRIORITIES:
            raise ValueError("unsupported priority")
        urls = list(dict.fromkeys(url.strip() for url in source_urls if url.strip()))
        if not urls or any(not valid_public_url(url) for url in urls):
            raise ValueError("at least one valid public HTTPS source is required")
        fingerprint = hashlib.sha256((title.lower() + "|" + urls[0]).encode()).hexdigest()
        duplicate = self.db.execute(select(Article).where(
            (Article.content_hash == fingerprint) |
            (Article.source_url == urls[0]) |
            (func.lower(Article.title) == title.lower())
        )).scalar_one_or_none()
        if duplicate:
            if reject_duplicate:
                raise DuplicateArticleError(duplicate.id)
            return duplicate
        base_slug = slugify(title)
        slug = base_slug
        suffix = 1
        while self.db.execute(select(Article.id).where(Article.slug == slug)).scalar_one_or_none():
            suffix += 1
            slug = f"{base_slug[:270]}-{suffix}"
        article = Article(
            slug=slug, title=title, summary=summary.strip(), body=body.strip(),
            category=category, priority=priority, related_asset=related_asset.upper()[:30],
            language=language[:10], source_url=urls[0], source_name=source_name[:200],
            source_published_at=source_published_at, sources_json=json.dumps(urls),
            content_hash=fingerprint, status="detected", is_fixture=is_fixture,
        )
        self.db.add(article)
        self.db.flush()
        self.record(article, "radar", "detected", evidence=urls)
        self.db.commit()
        return article

    def run_agent(self, agent: str, article_id: int) -> dict:
        article = self.db.get(Article, article_id)
        if article is None:
            raise ValueError("article not found")
        urls = json.loads(article.sources_json or "[]")
        if agent == "radar":
            self.record(article, agent, "normalized")
        elif agent == "verifier":
            self.record(article, agent, "verifying")
            valid = [url for url in urls if valid_public_url(url)]
            article.confidence_score = min(0.98, 0.68 + 0.16 * len(valid))
            if not valid:
                article.rejection_reason = "No valid public source"
                self.record(article, agent, "rejected", result="blocked", reason=article.rejection_reason)
            else:
                article.evidence_json = json.dumps(valid)
                self.record(article, agent, "verified", evidence=valid)
        elif agent == "editor-chief":
            if article.status != "verified":
                raise ValueError("editor-chief requires verified content")
            self.record(article, agent, "drafting")
        elif agent == "writer":
            if len(article.body.strip()) < (300 if article.priority == "breaking" else 800):
                self.record(article, agent, "reviewing", result="manual_required", reason="Body requires original reporting/context before publication")
                self.db.commit()
                return {"article_id": article.id, "status": article.status, "confidence": article.confidence_score, "advance": False}
            else:
                self.record(article, agent, "reviewing")
        elif agent == "reviewer":
            generic = len(set(re.findall(r"\w+", article.body.lower()))) < 90
            title_terms = {
                token for token in re.findall(r"[a-z0-9]+", article.title.lower())
                if len(token) > 3 and token not in TITLE_STOPWORDS
            }
            context = f"{article.summary} {article.body}".lower()
            incompatible_title = bool(title_terms) and not any(token in context for token in title_terms)
            if (generic or incompatible_title) and article.priority != "breaking":
                article.rejection_reason = "Article is too thin or repetitive"
                if incompatible_title:
                    article.rejection_reason = "Title is not supported by the article summary or body"
                self.record(article, agent, "rejected", result="blocked", reason=article.rejection_reason)
            else:
                self.record(article, agent, "reviewing")
        elif agent == "seo":
            article.seo_title = article.title[:60]
            article.seo_description = (article.summary or article.body[:280])[:160]
            article.canonical_url = f"{self.settings.public_site_url.rstrip('/')}/news/{article.slug}"
            self.record(article, agent, article.status)
        elif agent == "compliance":
            combined = f"{article.title} {article.summary} {article.body}".lower()
            reason = next((phrase for phrase in BLOCKED_PHRASES if phrase in combined), "")
            fixture_block = article.is_fixture and self.settings.app_env == "production"
            if reason or not urls or fixture_block:
                article.compliance_approved = False
                article.rejection_reason = f"Compliance block: {reason or ('fixture content in production' if fixture_block else 'missing source')}"
                self.record(article, agent, "compliance_failed", result="blocked", reason=article.rejection_reason)
            else:
                article.compliance_approved = True
                article.originality_approved = len(article.body) >= (300 if article.priority == "breaking" else 800)
                target = "ready" if article.originality_approved and article.confidence_score >= self.settings.editorial_minimum_confidence else "reviewing"
                self.record(article, agent, target, reason="manual review required" if target != "ready" else "")
        elif agent == "publisher":
            campaign = self.db.execute(
                select(BreakingCampaign)
                .where(BreakingCampaign.article_id == article.id)
                .order_by(BreakingCampaign.created_at.desc())
                .limit(1)
            ).scalar_one_or_none()
            publication_requested = campaign is None or campaign.publish_action == "publish"
            allowed = (
                article.status == "ready" and article.compliance_approved and
                article.originality_approved and bool(article.seo_title) and bool(urls) and
                publication_requested
            )
            explicitly_requested = campaign is not None and campaign.publish_action == "publish"
            if allowed and (self.settings.automatic_publish_enabled or explicitly_requested):
                article.published_at = article.published_at or utcnow()
                self.record(article, agent, "published")
            else:
                self.record(article, agent, article.status, result="held", reason="Publication was not requested, automatic publishing is disabled, or a gate is incomplete")
        elif agent == "distribution":
            if article.status not in {"ready", "published", "updated"}:
                return {"status": article.status, "prepared": 0}
            campaign = self.db.execute(
                select(BreakingCampaign)
                .where(BreakingCampaign.article_id == article.id)
                .order_by(BreakingCampaign.created_at.desc())
                .limit(1)
            ).scalar_one_or_none()
            if campaign is not None and not campaign.prepare_social:
                return {"article_id": article.id, "status": article.status, "prepared": 0, "advance": False}
            self.prepare_social(article)
            self.record(article, agent, article.status)
        else:
            raise ValueError(f"unknown editorial agent: {agent}")
        self.db.commit()
        return {"article_id": article.id, "status": article.status, "confidence": article.confidence_score, "advance": True}

    def prepare_social(self, article: Article) -> int:
        prepared = 0
        for channel in CHANNELS:
            exists = self.db.execute(select(SocialOutbox).where(
                SocialOutbox.article_id == article.id, SocialOutbox.channel == channel
            )).scalar_one_or_none()
            if exists:
                continue
            campaign = f"organic_{channel}"
            target = f"{article.canonical_url}?utm_source={quote(channel)}&utm_medium=social&utm_campaign={campaign}"
            copy = f"{article.title}\n\n{article.summary}\n\n{target}"
            self.db.add(SocialOutbox(
                article_id=article.id, channel=channel, utm_url=target,
                payload_json=json.dumps({"text": copy, "image_ratios": ["4:5", "1:1", "16:9", "9:16"]}),
            ))
            prepared += 1
        return prepared

    def daily_candidates(self) -> list[dict]:
        cutoff = utcnow() - timedelta(hours=24)
        rows = self.db.execute(
            select(Article)
            .where(
                Article.status.in_(("ready", "published", "updated")),
                Article.updated_at >= cutoff,
            )
            .order_by(Article.updated_at.desc())
            .limit(20)
        ).scalars()
        result = []
        for article in rows:
            campaign = self.db.execute(
                select(BreakingCampaign)
                .where(BreakingCampaign.article_id == article.id)
                .order_by(BreakingCampaign.created_at.desc())
                .limit(1)
            ).scalar_one_or_none()
            marked = bool(campaign and campaign.daily_candidate)
            score = round(article.confidence_score * 50 + (20 if article.priority == "breaking" else 10) + min(len(article.body) / 100, 20) + (10 if marked else 0), 2)
            result.append({
                "article_id": article.id, "title": article.title, "score": score,
                "reason": "confidence, urgency, article depth and explicit candidate status",
                "status": article.status, "marked_candidate": marked,
                "ad_package": {
                    "headline": article.seo_title or article.title[:60],
                    "description": article.seo_description or article.summary[:160],
                    "url": article.canonical_url,
                    "utm": f"{article.canonical_url}?utm_source=future_paid&utm_medium=cpc&utm_campaign=daily_candidate",
                    "suggested_image": article.image_url or "Create an original rights-cleared image that accurately represents the sourced event.",
                    "suggested_audience": ["cryptocurrency news", article.category, article.related_asset or "digital assets"],
                    "checklist": ["human fact review", "image rights", "landing page health", "policy review", "CEO approval"],
                    "activation": "disabled",
                },
            })
        return sorted(result, key=lambda item: item["score"], reverse=True)

    def metrics(self) -> dict:
        counts = dict(self.db.execute(select(Article.status, func.count(Article.id)).group_by(Article.status)).all())
        outbox = dict(self.db.execute(select(SocialOutbox.status, func.count(SocialOutbox.id)).group_by(SocialOutbox.status)).all())
        return {"articles": counts, "social_outbox": outbox}
