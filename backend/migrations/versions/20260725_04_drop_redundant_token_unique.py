"""drop redundant token_id unique constraint (unique index remains authoritative)

Revision ID: 20260725_04
Revises: 20260724_03
Create Date: 2026-07-25

Why a corrective migration instead of editing 20260724_03:
The production bootstrap workflow runs `alembic upgrade head` against the
production DATABASE_URL from whichever ref it is dispatched on, decoupled from
Render deploys, and the first administrator was created successfully -- so
20260724_03 may already be applied in production even though Render has not
deployed this SHA. Editing 03 would desynchronize an already-migrated database.
This migration converges both states: a fresh database ends up identical to a
production database that had 03 applied.

Security impact: none. token_id uniqueness (required for refresh rotation and
revocation) remains enforced by the unique index ix_refresh_sessions_token_id;
only the duplicate table-level UNIQUE constraint is removed, matching the
SQLAlchemy model (token_id: unique=True, index=True -> unique index only).
"""
import sqlalchemy as sa
from alembic import op

revision = "20260725_04"
down_revision = "20260724_03"
branch_labels = None
depends_on = None

CONSTRAINT = "refresh_sessions_token_id_key"


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(f'ALTER TABLE refresh_sessions DROP CONSTRAINT IF EXISTS "{CONSTRAINT}"')
    else:
        with op.batch_alter_table("refresh_sessions") as batch:
            try:
                batch.drop_constraint(CONSTRAINT, type_="unique")
            except Exception:
                pass


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            f'ALTER TABLE refresh_sessions ADD CONSTRAINT "{CONSTRAINT}" UNIQUE (token_id)'
        )
    else:
        with op.batch_alter_table("refresh_sessions") as batch:
            batch.create_unique_constraint(CONSTRAINT, ["token_id"])
