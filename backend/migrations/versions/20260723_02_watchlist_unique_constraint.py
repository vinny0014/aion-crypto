"""enforce one watchlist symbol per user

Revision ID: 20260723_02
Revises: 20260722_01
Create Date: 2026-07-23
"""
from alembic import op

revision = "20260723_02"
down_revision = "20260722_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint("uq_watchlist_items_user_symbol", "watchlist_items", ["user_id", "symbol"])


def downgrade() -> None:
    op.drop_constraint("uq_watchlist_items_user_symbol", "watchlist_items", type_="unique")
