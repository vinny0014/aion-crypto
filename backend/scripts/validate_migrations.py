#!/usr/bin/env python3
"""Assert that Alembic can initialize and re-run a PostgreSQL schema."""
from __future__ import annotations

import subprocess
import sys

from sqlalchemy import create_engine, inspect

from app.config import get_settings

EXPECTED_TABLES = {
    "articles", "cost_ledger", "incidents", "sources", "subscribers",
    "tasks", "users", "watchlist_items", "alembic_version",
}


def alembic(*args: str) -> None:
    subprocess.run([sys.executable, "-m", "alembic", "-c", "alembic.ini", *args], check=True)


def main() -> None:
    if not get_settings().database_url.startswith(("postgresql://", "postgresql+psycopg://")):
        raise SystemExit("validate_migrations requires PostgreSQL")
    alembic("upgrade", "head")
    alembic("current")
    alembic("heads")
    alembic("check")
    alembic("upgrade", "head")  # idempotency proof
    engine = create_engine(get_settings().database_url)
    try:
        missing = EXPECTED_TABLES - set(inspect(engine).get_table_names())
        if missing:
            raise SystemExit(f"migration missing tables: {', '.join(sorted(missing))}")
    finally:
        engine.dispose()
    print("PostgreSQL migrations: head, schema and idempotency verified.")


if __name__ == "__main__":
    main()
