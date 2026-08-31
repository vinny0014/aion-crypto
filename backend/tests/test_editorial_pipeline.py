import json

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models import Article, EditorialEvent, SocialOutbox
from app.pipeline.editorial import DuplicateArticleError, EditorialPipeline
from app.pipeline.registry import AGENTS, build_commander


@pytest.fixture
def session(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/editorial.db")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    yield db
    db.close()


def original_body():
    return "\n\n".join([
        "The published protocol notice describes a coordinated security update for Bitcoin node operators, including the affected release family, activation sequence, compatibility boundaries and the official repository where maintainers recorded the change.",
        "The chronology begins with responsible disclosure, continues through maintainer review and packaged releases, and ends with public guidance. The source does not report exploitation, financial loss or a change to Bitcoin monetary policy.",
        "Operators should compare their installed version with the release notes, validate downloaded signatures, review dependency requirements and follow their normal rollback procedure. They should not treat an unverified social post as equivalent to the primary notice.",
        "For exchanges, custodians and infrastructure providers, the operational impact depends on deployment practice, monitoring coverage and internal change controls. End users may see no visible interface difference even when backend nodes are updated.",
        "The announcement does not establish a price direction. Market reaction, if any, can be influenced by liquidity, leverage, macroeconomic news and unrelated events, so the technical release should not be presented as an investment signal.",
        "Readers should monitor amendments to the release notes, maintainer follow-up, confirmed incident reports and whether major infrastructure providers complete upgrades. This account will be updated if the primary source materially changes.",
        "AION Crypto separates facts stated in the official record from interpretation, keeps the source link attached and avoids invented quotations, volumes, percentages or guarantees. This coverage is informational and not personalized financial advice.",
    ])


def test_full_free_pipeline_reaches_ready_and_prepares_outbox(session):
    pipeline = EditorialPipeline(session)
    article = pipeline.create_detected(
        title="Bitcoin protocol release publishes a documented security update",
        summary="The official release documents the verified change, its operational context and the affected node-operator workflow.",
        body=original_body(), category="Bitcoin", priority="high",
        source_urls=["https://example.com/official-release"], source_name="Example official source",
        related_asset="BTC",
    )
    commander = build_commander(session)
    commander.enqueue("radar", {"article_id": article.id}, idempotency_key=f"article:{article.id}:radar")
    result = commander.run_cycle()
    session.refresh(article)
    assert result["done"] == len(AGENTS)
    assert article.status == "ready"  # automatic publishing is disabled by default
    assert article.compliance_approved and article.originality_approved
    assert article.canonical_url.endswith(f"/news/{article.slug}")
    assert session.query(SocialOutbox).count() == 5
    assert session.query(EditorialEvent).count() >= len(AGENTS)


def test_duplicate_source_is_idempotent(session):
    pipeline = EditorialPipeline(session)
    first = pipeline.create_detected(title="Ethereum foundation publishes a detailed protocol notice", summary="summary", body="", category="Ethereum", priority="normal", source_urls=["https://example.com/notice"])
    second = pipeline.create_detected(title="A different rendering of the same source notice", summary="summary", body="", category="Ethereum", priority="normal", source_urls=["https://example.com/notice"])
    assert first.id == second.id
    assert session.query(Article).count() == 1


def test_duplicate_normalized_title_is_idempotent_across_sources(session):
    pipeline = EditorialPipeline(session)
    first = pipeline.create_detected(title="Ethereum foundation publishes a detailed protocol notice", summary="summary", body="", category="Ethereum", priority="normal", source_urls=["https://example.com/notice-a"])
    second = pipeline.create_detected(title="Ethereum foundation publishes a detailed protocol notice", summary="another summary", body="", category="Ethereum", priority="normal", source_urls=["https://example.org/notice-b"])
    assert first.id == second.id
    assert session.query(Article).count() == 1


def test_manual_intake_can_reject_duplicate_instead_of_reusing_it(session):
    pipeline = EditorialPipeline(session)
    pipeline.create_detected(title="Regulator publishes a digital asset consultation notice", summary="summary", body="", category="Regulation", priority="normal", source_urls=["https://example.com/consultation"])
    with pytest.raises(DuplicateArticleError):
        pipeline.create_detected(title="Regulator publishes a digital asset consultation notice", summary="duplicate", body="", category="Regulation", priority="normal", source_urls=["https://example.org/copy"], reject_duplicate=True)


def test_thin_story_stays_in_review_instead_of_publishing(session):
    pipeline = EditorialPipeline(session)
    article = pipeline.create_detected(title="Bitcoin maintainers publish a security notice for node operators", summary="The notice is still developing.", body="Short operator note.", category="Bitcoin", priority="normal", source_urls=["https://example.com/security-notice"])
    commander = build_commander(session)
    commander.enqueue("radar", {"article_id": article.id})
    result = commander.run_cycle()
    session.refresh(article)
    assert result["done"] == 4
    assert article.status == "reviewing"
    assert article.published_at is None


def test_long_but_low_value_story_stays_in_review(session):
    pipeline = EditorialPipeline(session)
    article = pipeline.create_detected(
        title="Ethereum market update repeats a generic price narrative",
        summary="A generic market update repeats the same unsupported price observation without useful context or verification.",
        body=("Ethereum price moved today. The crypto market moved today. " * 80),
        category="Ethereum", priority="normal",
        source_urls=["https://example.com/market-update"], source_name="Example market feed",
    )
    commander = build_commander(session)
    commander.enqueue("radar", {"article_id": article.id})
    commander.run_cycle()
    session.refresh(article)
    assert article.status == "reviewing"
    assert "repetitive" in article.rejection_reason
    assert article.published_at is None


def test_near_duplicate_title_is_idempotent(session):
    pipeline = EditorialPipeline(session)
    first = pipeline.create_detected(
        title="Bitcoin developers publish an urgent node security update",
        summary="A sufficiently detailed summary describing the verified technical update and its operational scope.",
        body="", category="Bitcoin", priority="normal",
        source_urls=["https://example.com/update-one"], source_name="Primary source",
    )
    second = pipeline.create_detected(
        title="Bitcoin developer publishes urgent security update for nodes",
        summary="A second rendering of the same event from another public source with no additional value.",
        body="", category="Bitcoin", priority="normal",
        source_urls=["https://example.org/update-two"], source_name="Secondary source",
    )
    assert second.id == first.id
    assert session.query(Article).count() == 1


def test_compliance_blocks_profit_promise(session):
    pipeline = EditorialPipeline(session)
    article = pipeline.create_detected(title="XRP market commentary makes an unsupported guaranteed profit claim", summary="guaranteed profit", body=original_body(), category="XRP", priority="normal", source_urls=["https://example.com/source"])
    for agent in ("radar", "verifier", "editor-chief", "writer", "reviewer", "seo", "compliance"):
        pipeline.run_agent(agent, article.id)
    session.refresh(article)
    assert article.status == "compliance_failed"
    assert not article.compliance_approved


def test_social_payloads_have_channel_utms(session):
    pipeline = EditorialPipeline(session)
    article = pipeline.create_detected(title="Regulator publishes a new public digital asset consultation paper", summary="Public consultation", body=original_body(), category="Regulation", priority="high", source_urls=["https://example.com/consultation"])
    article.status = "ready"
    article.canonical_url = f"https://aioncrypto.cloud/news/{article.slug}"
    pipeline.prepare_social(article)
    session.commit()
    rows = session.execute(select(SocialOutbox)).scalars().all()
    assert len(rows) == 5
    assert all("utm_source=" in row.utm_url for row in rows)
    assert all("image_ratios" in json.loads(row.payload_json) for row in rows)


def test_source_scan_enqueues_detected_article_pipeline(session, monkeypatch):
    pipeline = EditorialPipeline(session)
    article = pipeline.create_detected(
        title="Bitcoin maintainers publish a sourced operational update",
        summary="The primary source records an operational change.",
        body="Short developing report.", category="Bitcoin", priority="normal",
        source_urls=["https://example.com/operational-update"],
    )
    monkeypatch.setattr(
        "app.pipeline.registry.scan_source",
        lambda _db, _source_id: {"detected": 1, "article_ids": [article.id], "status": "ok"},
    )
    commander = build_commander(session)
    commander.enqueue("source-scan", {"source_id": 7})
    result = commander.run_cycle()
    session.refresh(article)
    assert result["done"] == 5  # source scan + radar/verifier/editor/writer
    assert article.status == "reviewing"
    assert session.query(EditorialEvent).filter(EditorialEvent.article_id == article.id).count() >= 5
