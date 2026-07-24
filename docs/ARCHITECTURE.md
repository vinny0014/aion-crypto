# Architecture

## Overview
Monorepo with an independent frontend and backend. Fully separate from AION News (no shared code, DB, hosting, secrets or domains).

```
Browser ──> Next.js 15 (App Router, SSR/ISR, revalidate 60s)
                │  server-side fetch
                ▼
            FastAPI backend (/api/v1/*)
                │
        ┌───────┼────────────┐
        ▼       ▼            ▼
   TTL cache  SQLite/     Public market APIs
   + last-    PostgreSQL  (Binance primary,
   valid file (Supabase)   CoinGecko fallback)
```

## Data provenance contract (core invariant)
Every market payload is wrapped as `{data, source, status, stale, fetched_at}`.
Chain: **Binance → CoinGecko → TTL cache → persisted last-valid (flagged `stale`) → explicit `unavailable`.**
The UI renders a provenance badge on every data block. Zeros or invented values are never used as fallback. Frontend fixtures exist only for backend-offline development and are labeled `sample`.

## Backend modules
- `app/services/market.py` — data layer + coin registry (identity only; prices always from APIs)
- `app/circuit_breaker.py` — provider failure threshold and recovery window
- `app/middleware.py` — process-local API/login rate-limit safety layer
- `app/cache.py` — TTL cache + atomic last-valid JSON store
- `app/cost_guard.py` — monthly paid-API ceiling with bands NORMAL/ECONOMY/ESSENTIAL_ONLY/BLOCKED
- `app/pipeline/commander.py` — persistent task queue: claim/lock, one attempt per cycle, exponential-backoff-ready retries, dead-letter, stuck-task recovery, per-cycle limit
- `app/security.py` + `app/routers/auth.py` — bcrypt + JWT access/refresh, role guard (admin/editor/viewer)
- `app/models.py` — users, sources, articles, tasks, cost ledger, subscribers, watchlist, incidents
- `migrations/` — Alembic baseline used instead of production `create_all`

## Frontend modules
- `lib/api.ts` — server-side fetchers honoring the provenance contract
- `components/charts.tsx` — hand-rolled SVG charts (area, candles, sparkline, donut, gauge): real data, no static images, fixed viewBox (no layout shift)
- `components/home.tsx` — homepage sections mirroring the mockup structure/density
- Route set: home, /markets, /crypto/[symbol], /news(+slug), /search, /watchlist, /login, learn/guides/glossary/analysis/research, full legal/policy set, /status, 404/500, sitemap.xml, robots.txt

## Planned next (see WORK_HANDOFF.md)
Discovery/Content/Verification/Image agents on top of Commander, scheduler/worker entrypoints, Monitor Recovery loop, newsletter double opt-in delivery, real CMS integration and analytics wiring. The operations dashboard reports these connections as unavailable until they exist.
