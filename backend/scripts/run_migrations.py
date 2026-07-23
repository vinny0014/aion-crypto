#!/usr/bin/env python3
"""Run Alembic safely before a Render web process starts.

PostgreSQL advisory locking prevents two concurrent starts from applying the
same revision. The lock is held only while Alembic runs and neither this script
nor Alembic prints DATABASE_URL values.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import get_settings

LOCK_KEY = 726044021


def upgrade() -> None:
    subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
        cwd=ROOT,
        check=True,
    )


def main() -> None:
    database_url = get_settings().database_url
    print("Starting database migrations.", flush=True)
    if database_url.startswith(("postgresql://", "postgresql+psycopg://")):
        engine = create_engine(database_url, pool_pre_ping=True)
        with engine.connect() as connection:
            connection.execute(text("SELECT pg_advisory_lock(:key)"), {"key": LOCK_KEY})
            try:
                upgrade()
            finally:
                connection.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": LOCK_KEY})
        engine.dispose()
    else:
        upgrade()
    print("Database migrations completed.", flush=True)


if __name__ == "__main__":
    main()
