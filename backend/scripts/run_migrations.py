#!/usr/bin/env python3
"""Run Alembic safely before a Render web process starts.

The migration environment acquires the PostgreSQL transaction advisory lock on
the same connection that executes DDL. Keeping the lock there prevents
overlapping Render startups without the cross-connection deadlock caused by a
wrapper-held session lock.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def upgrade() -> None:
    subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
        cwd=ROOT,
        check=True,
    )


def main() -> None:
    print("Starting database migrations.", flush=True)
    upgrade()
    print("Database migrations completed.", flush=True)


if __name__ == "__main__":
    main()
