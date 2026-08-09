#!/usr/bin/env python3
"""Assert that Alembic can initialize and re-run a PostgreSQL schema."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect, text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import get_settings

EXPECTED_TABLES = {
    "articles", "cost_ledger", "incidents", "sources", "subscribers",
    "tasks", "users", "watchlist_items", "refresh_sessions", "alembic_version",
    "subscriber_preferences", "editorial_events", "social_outbox",
    "breaking_campaigns",
}


def alembic(*args: str) -> None:
    subprocess.run([sys.executable, "-m", "alembic", "-c", "alembic.ini", *args], check=True)


def main() -> None:
    if not get_settings().database_url.startswith(("postgresql://", "postgresql+psycopg://")):
        raise SystemExit("validate_migrations requires PostgreSQL")

    # Supabase supplies these roles. The disposable CI PostgreSQL service does
    # not, so create NOLOGIN stand-ins solely to test privilege revocation.
    bootstrap_engine = create_engine(get_settings().database_url)
    try:
        with bootstrap_engine.begin() as connection:
            connection.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                        CREATE ROLE anon NOLOGIN;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                        CREATE ROLE authenticated NOLOGIN;
                    END IF;
                END $$;
            """))
    finally:
        bootstrap_engine.dispose()

    alembic("upgrade", "head")
    alembic("current")
    alembic("heads")
    alembic("check")
    alembic("upgrade", "head")  # idempotency proof
    engine = create_engine(get_settings().database_url)
    try:
        inspector = inspect(engine)
        table_names = set(inspector.get_table_names())
        missing = EXPECTED_TABLES - table_names
        if missing:
            raise SystemExit(f"migration missing tables: {', '.join(sorted(missing))}")
        with engine.connect() as connection:
            rls_disabled = [row[0] for row in connection.execute(text("""
                SELECT c.relname
                FROM pg_class AS c
                JOIN pg_namespace AS n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                  AND c.relname = ANY(:tables)
                  AND NOT c.relrowsecurity
            """), {"tables": list(EXPECTED_TABLES)})]
            public_access = [row[0] for row in connection.execute(text("""
                SELECT c.relname
                FROM pg_class AS c
                JOIN pg_namespace AS n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                  AND c.relname = ANY(:tables)
                  AND (
                    has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE')
                    OR has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE')
                  )
            """), {"tables": list(EXPECTED_TABLES)})]
        if rls_disabled:
            raise SystemExit(f"RLS disabled for: {', '.join(sorted(rls_disabled))}")
        if public_access:
            raise SystemExit(
                "Supabase Data API roles retain DML access to: "
                + ", ".join(sorted(public_access))
            )
    finally:
        engine.dispose()
    print("PostgreSQL migrations: head, schema and idempotency verified.")


if __name__ == "__main__":
    main()
