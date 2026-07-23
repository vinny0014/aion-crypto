#!/usr/bin/env sh
set -eu

echo "Render startup: running safe migrations"
python scripts/run_migrations.py
echo "Render startup: migrations complete; starting API"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:?PORT is required}" --proxy-headers
