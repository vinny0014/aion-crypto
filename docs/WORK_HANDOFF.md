# WORK HANDOFF — AION Crypto → GPT Work review stage

## Repository state
- Local git repo, branch `main`, 8 conventional commits (see `git log`). **Not yet pushed**: the build environment has no GitHub credentials for `vinny0014`. First action: create `vinny0014/aion-crypto` (private), `git remote add origin … && git push -u origin main`, create `develop`, enable branch protection + secret scanning.
- CI (`.github/workflows/ci.yml`): backend pytest, frontend typecheck+build, security job. Dependabot configured.

## What is DONE and TESTED
| Area | Status | Evidence |
|---|---|---|
| Backend boots, /health OK | ✅ | manual run + test |
| Market layer: Binance→CoinGecko→cache→last-valid→unavailable | ✅ | 8 tests (incl. stale + unavailable paths) |
| Cost Guard bands + ledger + blocking | ✅ | 4 tests |
| Commander queue (lock/retry/backoff/DLQ/recovery/cycle-limit) | ✅ | 6 tests incl. regression |
| JWT auth + roles + protected route | ✅ | API tests |
| DB schema (users, articles, sources, tasks, cost, subscribers, watchlist, incidents) | ✅ | created via init_db |
| Frontend production build, 30+ routes | ✅ | `npm run build` green |
| Homepage structure vs mockup | ✅ (structural) | 18-point DOM assertion, all present |
| Coin page with area+candle charts, stats, SEO, schema | ✅ | 200 on /crypto/BTC; 404 on unknown |
| Sitemap, robots, canonical, OG, Organization/NewsArticle/Breadcrumb schema | ✅ | routes render |
| Watchlist (add/remove/reorder/persist localStorage) | ✅ | client page |
| No secrets in repo; .env.example complete | ✅ | CI secret scan |

Test totals: backend **23 passed**; frontend typecheck + build green; production server smoke-tested.

## Known environment caveat
The sandbox cannot reach Binance/CoinGecko, so live-data paths return honest `unavailable`/fixtures here; the fallback chain itself is fully covered by mocked tests. **First validation on a normal machine: run both apps and confirm homepage badges turn `live`.**

## NOT done (priority order for GPT Work)
1. Push to GitHub; run CI; fix anything environment-specific.
2. Pixel visual audit (screenshots 1440/768/390) vs mockup; close gaps listed in VISUAL_AUDIT.md (target ≥95% desktop).
3. Admin UI (dashboard, agents, tasks/queue, cost, logs, incidents, settings) over the existing APIs — every page functional, "NOT CONNECTED/NO DATA" states, no decorative buttons.
4. Pipeline agents on Commander: Discovery (RSS + dedup rules), Content (templates first), Verification gates, Image (template system 1200×630 + validation), SEO Publisher, Monitor Recovery loop, APScheduler wiring.
5. Alembic baseline migration; switch prod to Supabase PostgreSQL (`psycopg`); backup automation.
6. Rate limiting (login + public API), CSP, password recovery; audit logging.
7. Fear&Greed via alternative.me API (free) to replace/augment Market Breadth; ETF flow & liquidations only if a legitimate free source exists — otherwise keep sections out.
8. Newsletter: SMTP + double opt-in + unsubscribe endpoints (schema ready).
9. GA4 wiring behind `VITE_GA_MEASUREMENT_ID` (no fake IDs); news-sitemap and image-sitemap once pipeline publishes.
10. Videos/Podcasts/feature-strip sections when real content/tools exist.

## Risks
- Public API rate limits under traffic → tune TTL, add per-IP caching/CDN.
- Hostinger shared hosting can't run Python → plan VPS for backend (documented).
- Editorial fixtures must be replaced before any public launch (labeled as previews).

## Environment variables
See docs/ENVIRONMENT_VARIABLES.md. Production musts: strong JWT_SECRET, Supabase DATABASE_URL, real domain URLs.
