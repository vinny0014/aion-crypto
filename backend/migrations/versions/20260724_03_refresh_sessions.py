"""persist rotating refresh sessions for logout

Revision ID: 20260724_03
Revises: 20260723_02
Create Date: 2026-07-24
"""
import sqlalchemy as sa
from alembic import op

revision = "20260724_03"
down_revision = "20260723_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refresh_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_id", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_id"),
    )
    op.create_index(op.f("ix_refresh_sessions_user_id"), "refresh_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_refresh_sessions_token_id"), "refresh_sessions", ["token_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_refresh_sessions_token_id"), table_name="refresh_sessions")
    op.drop_index(op.f("ix_refresh_sessions_user_id"), table_name="refresh_sessions")
    op.drop_table("refresh_sessions")
