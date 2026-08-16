"""Add the private, idempotent Manus webhook event inbox.

Revision ID: 20260813_10
Revises: 20260812_09
"""
from alembic import op
import sqlalchemy as sa

revision = "20260813_10"
down_revision = "20260812_09"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "manus_webhook_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(200), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("task_id", sa.String(200), nullable=False),
        sa.Column("task_title", sa.String(500), nullable=False, server_default=""),
        sa.Column("task_url", sa.String(1000), nullable=False, server_default=""),
        sa.Column("stop_reason", sa.String(40), nullable=False, server_default=""),
        sa.Column("message", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(30), nullable=False, server_default="received"),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_manus_webhook_events_event_id", "manus_webhook_events", ["event_id"], unique=True)
    op.create_index("ix_manus_webhook_events_event_type", "manus_webhook_events", ["event_type"])
    op.create_index("ix_manus_webhook_events_task_id", "manus_webhook_events", ["task_id"])
    op.create_index("ix_manus_webhook_events_status", "manus_webhook_events", ["status"])
    op.execute("ALTER TABLE public.manus_webhook_events ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON TABLE public.manus_webhook_events FROM PUBLIC")
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                REVOKE ALL ON TABLE public.manus_webhook_events FROM anon;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                REVOKE ALL ON TABLE public.manus_webhook_events FROM authenticated;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.drop_index("ix_manus_webhook_events_status", table_name="manus_webhook_events")
    op.drop_index("ix_manus_webhook_events_task_id", table_name="manus_webhook_events")
    op.drop_index("ix_manus_webhook_events_event_type", table_name="manus_webhook_events")
    op.drop_index("ix_manus_webhook_events_event_id", table_name="manus_webhook_events")
    op.drop_table("manus_webhook_events")
