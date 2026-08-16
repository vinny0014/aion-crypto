"""Expand the canonical active Mascot Arena roster from Top 10 to Top 15.

The update is deliberately narrow and idempotent: it only upgrades the
original, unrotated Top 10 roster. Historical rounds and vote rows are never
changed or deleted.

Revision ID: 20260816_14
Revises: 20260815_13
"""
from alembic import op


revision = "20260816_14"
down_revision = "20260815_13"
branch_labels = None
depends_on = None


TOP_10 = '["BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK", "AVAX", "DOT"]'
TOP_15 = (
    '["BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK", '
    '"AVAX", "DOT", "SHIB", "PEPE", "HYPE", "TRX", "SUI"]'
)
TOP_15_RESERVE = '["TON", "MATIC", "ATOM", "NEAR", "APT", "ARB", "INJ", "LTC", "UNI"]'


def upgrade() -> None:
    # JSONB equality makes a repeated execution a no-op. The predicate avoids
    # rewriting a live round that has already gone through a rotation.
    op.execute(
        f"""
        UPDATE mascot_arena_rounds
        SET roster_json = '{TOP_15}',
            reserve_json = '{TOP_15_RESERVE}'
        WHERE status = 'active'
          AND roster_json::jsonb = '{TOP_10}'::jsonb
        """
    )


def downgrade() -> None:
    # Data-safe no-op: shrinking an active roster could orphan legitimate Top
    # 15 votes. A rollback must preserve every vote and its visible entrant.
    pass
