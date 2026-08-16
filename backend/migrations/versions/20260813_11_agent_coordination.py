"""Add private lease-based coordination for Codex and Manus.

Revision ID: 20260813_11
Revises: 20260813_10
"""
from alembic import op
import sqlalchemy as sa

revision = "20260813_11"
down_revision = "20260813_10"
branch_labels = None
depends_on = None


def _lock_down(table: str) -> None:
    op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"REVOKE ALL ON TABLE public.{table} FROM PUBLIC")
    op.execute(f"""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                REVOKE ALL ON TABLE public.{table} FROM anon;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                REVOKE ALL ON TABLE public.{table} FROM authenticated;
            END IF;
        END $$;
    """)


def upgrade() -> None:
    op.create_table(
        "agent_coordination_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("idempotency_key", sa.String(160), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="queued"),
        sa.Column("current_actor", sa.String(20), nullable=False),
        sa.Column("lease_token_hash", sa.String(64), nullable=False, server_default=""),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="6"),
        sa.Column("blocker_type", sa.String(40), nullable=False, server_default=""),
        sa.Column("blocker_detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("result_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_agent_coordination_tasks_idempotency_key", "agent_coordination_tasks", ["idempotency_key"], unique=True)
    op.create_index("ix_agent_coordination_tasks_status", "agent_coordination_tasks", ["status"])
    op.create_index("ix_agent_coordination_tasks_current_actor", "agent_coordination_tasks", ["current_actor"])
    op.create_index("ix_agent_coordination_tasks_lease_expires_at", "agent_coordination_tasks", ["lease_expires_at"])
    op.create_table(
        "agent_coordination_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("agent_coordination_tasks.id"), nullable=False),
        sa.Column("actor", sa.String(20), nullable=False, server_default="system"),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_agent_coordination_events_task_id", "agent_coordination_events", ["task_id"])
    op.create_index("ix_agent_coordination_events_actor", "agent_coordination_events", ["actor"])
    op.create_index("ix_agent_coordination_events_event_type", "agent_coordination_events", ["event_type"])
    op.create_index("ix_agent_coordination_events_created_at", "agent_coordination_events", ["created_at"])
    _lock_down("agent_coordination_tasks")
    _lock_down("agent_coordination_events")


def downgrade() -> None:
    op.drop_table("agent_coordination_events")
    op.drop_table("agent_coordination_tasks")
