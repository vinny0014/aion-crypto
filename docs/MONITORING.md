# Monitoring

## Available now
- `GET /health` — app + database status, uptime.
- Provenance badges on every data block (live / stale / sample / unavailable) make data-source degradation user-visible immediately.
- Commander dead-letter queue surfaces failing pipeline tasks; `recover_stuck()` self-heals after restarts.
- `Incident` model persisted for the recovery loop.

## Monitor Recovery loop (to implement — handoff item)
detect → classify → open incident → create recovery task → retry with backoff → recover → validate → alert.
Watches: frontend, backend, DB, scheduler, queue depth, market API freshness, last publication age, images, RSS/sitemap/robots reachability, storage, memory/disk, costs, domain/SSL expiry, deploy status. Runs on free infrastructure; no paid AI involved.
