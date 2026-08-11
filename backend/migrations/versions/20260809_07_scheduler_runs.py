"""Add a persistent editorial scheduler run ledger and lease.

Revision ID: 20260809_07
Revises: 20260809_06
"""
from alembic import op
import sqlalchemy as sa

revision = "20260809_07"
down_revision = "20260809_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("scheduler_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("run_key", sa.String(80), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="running"),
        sa.Column("trigger", sa.String(20), nullable=False, server_default="scheduled"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sources_scanned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("items_seen", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("articles_detected", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duplicates_rejected", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("published", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=False, server_default=""),
    )
    op.create_index("ix_scheduler_runs_run_key", "scheduler_runs", ["run_key"])
    op.create_index("ix_scheduler_runs_status", "scheduler_runs", ["status"])
    op.execute("ALTER TABLE public.scheduler_runs ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON TABLE public.scheduler_runs FROM PUBLIC")
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                REVOKE ALL ON TABLE public.scheduler_runs FROM anon;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                REVOKE ALL ON TABLE public.scheduler_runs FROM authenticated;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.drop_index("ix_scheduler_runs_status", table_name="scheduler_runs")
    op.drop_index("ix_scheduler_runs_run_key", table_name="scheduler_runs")
    op.drop_table("scheduler_runs")
