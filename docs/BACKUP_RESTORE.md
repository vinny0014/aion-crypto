# Backup & Restore

## Production (Supabase PostgreSQL)
- Supabase free tier includes daily backups; additionally schedule `pg_dump` weekly to off-site storage:
  `pg_dump "$DATABASE_URL" | gzip > aion-crypto-$(date +%F).sql.gz`
- Restore: `gunzip -c dump.sql.gz | psql "$DATABASE_URL"` into a fresh database, then repoint `DATABASE_URL`.
- Quarterly restore drill: restore into a scratch project and verify article + user counts.

## Local
SQLite file `backend/aion_crypto_dev.db` — copy the file. The last-valid market store (`backend/data/last_valid.json`) is disposable cache; do not back up.

## What is never backed up into git
`.env`, DB files, `backend/data/*` — enforced via .gitignore.
