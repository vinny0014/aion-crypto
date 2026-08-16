"""Add private weekly Mascot Arena rounds and anonymous vote ledger.

Revision ID: 20260814_12
Revises: 20260813_11
"""
from alembic import op
import sqlalchemy as sa

revision = "20260814_12"
down_revision = "20260813_11"
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
        "mascot_arena_rounds",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("week_key", sa.String(16), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("champion_symbol", sa.String(20), nullable=False, server_default=""),
        sa.Column("top_three_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("roster_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("reserve_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("next_roster_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("next_reserve_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("relegated_symbol", sa.String(20), nullable=False, server_default=""),
        sa.Column("promoted_symbol", sa.String(20), nullable=False, server_default=""),
        sa.Column("finalized_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_mascot_arena_rounds_week_key", "mascot_arena_rounds", ["week_key"], unique=True)
    op.create_index("ix_mascot_arena_rounds_status", "mascot_arena_rounds", ["status"])
    op.create_index("ix_mascot_arena_rounds_starts_at", "mascot_arena_rounds", ["starts_at"])
    op.create_index("ix_mascot_arena_rounds_ends_at", "mascot_arena_rounds", ["ends_at"])
    op.create_index("ix_mascot_arena_rounds_champion_symbol", "mascot_arena_rounds", ["champion_symbol"])

    op.create_table(
        "mascot_arena_votes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("round_id", sa.Integer(), sa.ForeignKey("mascot_arena_rounds.id"), nullable=False),
        sa.Column("mascot_symbol", sa.String(20), nullable=False),
        sa.Column("voter_hash", sa.String(64), nullable=False),
        sa.Column("ip_hash", sa.String(64), nullable=False),
        sa.Column("vote_day", sa.String(10), nullable=False),
        sa.Column("source", sa.String(120), nullable=False, server_default="arena"),
        sa.Column("voted_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("round_id", "voter_hash", "vote_day", name="uq_mascot_vote_round_voter_day"),
    )
    op.create_index("ix_mascot_arena_votes_round_id", "mascot_arena_votes", ["round_id"])
    op.create_index("ix_mascot_arena_votes_mascot_symbol", "mascot_arena_votes", ["mascot_symbol"])
    op.create_index("ix_mascot_arena_votes_voter_hash", "mascot_arena_votes", ["voter_hash"])
    op.create_index("ix_mascot_arena_votes_ip_hash", "mascot_arena_votes", ["ip_hash"])
    op.create_index("ix_mascot_arena_votes_vote_day", "mascot_arena_votes", ["vote_day"])
    op.create_index("ix_mascot_arena_votes_voted_at", "mascot_arena_votes", ["voted_at"])
    op.create_index(
        "ix_mascot_arena_votes_round_rank",
        "mascot_arena_votes",
        ["round_id", "mascot_symbol"],
    )
    op.create_index(
        "ix_mascot_arena_votes_ip_time",
        "mascot_arena_votes",
        ["ip_hash", "voted_at"],
    )
    _lock_down("mascot_arena_rounds")
    _lock_down("mascot_arena_votes")


def downgrade() -> None:
    op.drop_table("mascot_arena_votes")
    op.drop_table("mascot_arena_rounds")
