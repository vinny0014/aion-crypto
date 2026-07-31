"""editorial operations and audience foundation

Revision ID: 20260731_05
Revises: 20260725_04
"""
from alembic import op
import sqlalchemy as sa

revision = "20260731_05"
down_revision = "20260725_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("sources") as batch:
        batch.add_column(sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("last_success_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("last_error", sa.Text(), nullable=False, server_default=""))
    with op.batch_alter_table("articles") as batch:
        batch.add_column(sa.Column("subtitle", sa.String(500), nullable=False, server_default=""))
        batch.add_column(sa.Column("language", sa.String(10), nullable=False, server_default="en"))
        batch.add_column(sa.Column("related_asset", sa.String(30), nullable=False, server_default=""))
        batch.add_column(sa.Column("priority", sa.String(20), nullable=False, server_default="normal"))
        batch.add_column(sa.Column("sources_json", sa.Text(), nullable=False, server_default="[]"))
        batch.add_column(sa.Column("evidence_json", sa.Text(), nullable=False, server_default="[]"))
        batch.add_column(sa.Column("source_published_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("is_fixture", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("confidence_score", sa.Float(), nullable=False, server_default="0"))
        batch.add_column(sa.Column("compliance_approved", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("originality_approved", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("seo_title", sa.String(300), nullable=False, server_default=""))
        batch.add_column(sa.Column("seo_description", sa.String(320), nullable=False, server_default=""))
        batch.add_column(sa.Column("canonical_url", sa.String(600), nullable=False, server_default=""))
        batch.add_column(sa.Column("author_name", sa.String(120), nullable=False, server_default="AION Crypto"))
        batch.add_column(sa.Column("rejection_reason", sa.Text(), nullable=False, server_default=""))
        batch.create_index("ix_articles_priority", ["priority"])
    with op.batch_alter_table("subscribers") as batch:
        batch.add_column(sa.Column("source", sa.String(200), nullable=False, server_default="website"))
        batch.add_column(sa.Column("confirmation_token_hash", sa.String(64), nullable=False, server_default=""))
        batch.add_column(sa.Column("unsubscribe_token_hash", sa.String(64), nullable=False, server_default=""))
        batch.add_column(sa.Column("consent_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("unsubscribed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table("subscriber_preferences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subscriber_id", sa.Integer(), sa.ForeignKey("subscribers.id"), nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("subscriber_id", "category", name="uq_subscriber_preference"))
    op.create_index("ix_subscriber_preferences_subscriber_id", "subscriber_preferences", ["subscriber_id"])
    op.create_index("ix_subscriber_preferences_category", "subscriber_preferences", ["category"])

    op.create_table("editorial_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("articles.id"), nullable=True),
        sa.Column("agent", sa.String(50), nullable=False),
        sa.Column("from_state", sa.String(30), nullable=False),
        sa.Column("to_state", sa.String(30), nullable=False),
        sa.Column("result", sa.String(30), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("evidence_json", sa.Text(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    for column in ("article_id", "agent", "to_state", "created_at"):
        op.create_index(f"ix_editorial_events_{column}", "editorial_events", [column])

    op.create_table("social_outbox",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("articles.id"), nullable=False),
        sa.Column("channel", sa.String(30), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("utm_url", sa.String(800), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("article_id", "channel", name="uq_social_outbox_article_channel"))
    for column in ("article_id", "channel", "status"):
        op.create_index(f"ix_social_outbox_{column}", "social_outbox", [column])

    op.create_table("breaking_campaigns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("provisional_title", sa.String(300), nullable=False),
        sa.Column("fact_summary", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("primary_source", sa.String(800), nullable=False),
        sa.Column("additional_sources_json", sa.Text(), nullable=False),
        sa.Column("related_asset", sa.String(30), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("image_url", sa.String(800), nullable=False),
        sa.Column("urgency", sa.String(20), nullable=False),
        sa.Column("language", sa.String(10), nullable=False),
        sa.Column("publish_action", sa.String(30), nullable=False),
        sa.Column("prepare_social", sa.Boolean(), nullable=False),
        sa.Column("daily_candidate", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("articles.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_breaking_campaigns_status", "breaking_campaigns", ["status"])

def downgrade() -> None:
    op.drop_table("breaking_campaigns")
    op.drop_table("social_outbox")
    op.drop_table("editorial_events")
    op.drop_table("subscriber_preferences")
    with op.batch_alter_table("subscribers") as batch:
        for column in ("unsubscribed_at", "confirmed_at", "consent_at", "unsubscribe_token_hash", "confirmation_token_hash", "source"):
            batch.drop_column(column)
    with op.batch_alter_table("articles") as batch:
        batch.drop_index("ix_articles_priority")
        for column in ("rejection_reason", "author_name", "canonical_url", "seo_description", "seo_title", "originality_approved", "compliance_approved", "confidence_score", "is_fixture", "source_published_at", "evidence_json", "sources_json", "priority", "related_asset", "language", "subtitle"):
            batch.drop_column(column)
    with op.batch_alter_table("sources") as batch:
        for column in ("last_error", "last_success_at", "last_checked_at"):
            batch.drop_column(column)
