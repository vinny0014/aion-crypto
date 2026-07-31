# AION Crypto — Incremental AdSense audit

Audit date: 2026-07-31

Initial SHA: `b052a8ad3d4060a47ee04ff4439ab5534983c935`

Work branch: `codex/aion-crypto-incremental-adsense`

Existing Draft PR: #1, `codex/aion-crypto-production-review` → `main`

Initial CI evidence: run #63 (`30319690519`) completed successfully on the initial SHA

Decision: **do not request AdSense yet**

## State found before incremental changes

- The frontend is Next.js 15 on Hostinger and the backend is FastAPI/SQLAlchemy/Alembic on Render. The existing `DATABASE_URL` contract and deployment topology are unchanged.
- The database already contained `sources`, `articles`, a persistent idempotent `tasks` queue, subscribers, cost ledger, incidents, users and watchlists. The Commander already supplied locks, retries, backoff, dead-letter handling and bounded cycles.
- Six English news fixtures existed in `frontend/lib/fixtures.ts`. They used relative development times, had no retained source URLs and were intentionally `noindex`; there was no real collector or registered editorial handler.
- The public news page, article routes, home, search and coin-related coverage all read those fixtures. Replacing only the article route would therefore create broken fixture links elsewhere.
- The general sitemap and robots route existed. News sitemap and RSS were valid but empty; image sitemap was empty. Canonical metadata, Open Graph, Twitter cards, Organization/WebSite JSON-LD, real 404 handling and security headers already existed.
- GA4/Clarity code was configuration-gated. Search Console and Analytics account state cannot be proven from the repository. No AdSense client or publisher ID existed.
- Market data used Binance public endpoints with CoinGecko fallback, cache, persisted last-valid data and explicit live/stale/sample/unavailable provenance. Global metrics depend on CoinGecko and can honestly become unavailable; that isolated flow should be preserved rather than replaced.
- Core About, Contact, Privacy, Terms, Editorial, Corrections, Disclaimer and Risk pages existed. Cookie, methodology, publisher, organizational author, copyright/DMCA and accessibility pages were absent.
- The newsletter page echoed the email in the URL and did not persist consent or preferences.

## Audit classification

| Area | Already works | Small adjustment applied | External configuration | Do not alter | Production risk | Priority |
|---|---|---|---|---|---|---|
| Architecture | Next.js + FastAPI + SQLAlchemy/Alembic | Reused existing models, Commander, auth, admin and API prefixes | None | Frameworks, hosts, domain, API contracts | Large rewrite would destabilize production | P0 preserve |
| News storage | Additive `articles` foundation | Added source evidence, status, confidence, rejection, SEO and source date fields | Apply migration after backup | Existing rows and columns | Migration must run before new backend code | P0 |
| Discovery | `sources` table and task queue | Added opt-in bounded RSS/Atom scan and Radar→pipeline handoff | Add approved feeds manually | No scraping of disallowed pages | Bad feed, SSRF, duplicate jobs | P1 |
| Quality | Queue/retry mechanics | Source, duplicate, empty/thin, title/body, fixture-production, originality and compliance gates | Editorial source approval | Old articles are not rewritten | Deterministic checks cannot replace fact judgment | P0 |
| Publishing | Article model and role auth | Added protected Breaking News intake and reused the same article/publication path | Administrator review | No second CMS | Explicit publish still requires every gate | P0 |
| Public news | Existing routes and visual system | Database-only published articles; fixture links removed from home/search/coins; former fixture URLs redirect to `/news` | Publish real material | Typography and layout | Empty state until real articles exist | P0 |
| Audience | Subscriber base table | Consent, preferences, hashed tokens, honeypot, lower rate bucket and protected CSV export | Email delivery remains disabled | No paid email platform | Confirmation cannot be delivered yet | P1 |
| Social | None | Five-channel internal outbox, copy action, UTM and status | OAuth/tokens only when approved | No automatic external post | Token leakage/spam if enabled carelessly | P2 |
| Institutional | Core pages existed | Added only missing truthful pages and footer links | Verify displayed email aliases | No invented staff/address/phone | Unproven contact alias harms trust | P1 |
| SEO | Canonical, robots, sitemap, OG/Twitter, Organization/WebSite | Published-only sitemap/RSS/news sitemap, NewsArticle/BreadcrumbList, noindex for private/search routes | Search Console validation | Existing canonical/domain rules | Backend outage can temporarily empty dynamic feeds | P1 |
| AdSense | None | Disabled bootstrap, configuration guards and conditional `/ads.txt` | Real Google IDs, consent and approval | No fake/test ad or ID | Premature enablement violates privacy/readiness | Blocked |
| Market | Real providers, cache, provenance | Removed fixture-based editorial summary; retained honest degraded state | Check Render logs/provider behavior | Healthy ticker/coin/klines flows | CoinGecko rate limits Global Metrics | P1 isolated |
| Cost | Existing USD API guard | Added R$300 ceiling, R$250 known baseline and R$50 headroom reporting | Verify actual invoices monthly | No plan upgrades or paid API | GitHub schedule allowance/Render limits | P0 |

## Incremental implementation boundaries

- No technology, host, domain, public route, table or existing column was removed or renamed.
- The single new migration is additive and has a reverse-order downgrade. Existing article contents are untouched.
- The nine editorial “agents” are functions/stages in the existing backend process, not services or microservices. Two decorative no-op stages from the interrupted 90-day draft were deliberately removed.
- No recurring source scheduler was added. Scans are manually queued through authenticated admin routes. Automatic publication is disabled by default; an authenticated operator can explicitly request publication, but only a fully ready article can publish.
- RSS retrieval is opt-in, HTTPS-only, redirect-disabled, size/item/time limited and checks public address resolution. Sources must still be approved manually.
- The Supabase/Postgres connection remains the existing SQLAlchemy `DATABASE_URL`; the implementation does not depend on Supabase Data API grants. Current Supabase changes concerning Postgres versions, Data API exposure and RLS must be checked in the dashboard before migration. No grant or RLS policy was guessed in code because the production role/topology was not available.

## Baseline and deploy evidence

- Clean baseline backend suite: 47 collected, 46 passed and one existing PostgreSQL-only test skipped without a real PostgreSQL URL.
- Clean baseline frontend: lint, typecheck and production build passed.
- GitHub: initial SHA and PR/CI state were read from the authenticated connector; GitHub CLI was unavailable in this environment.
- Public domain: Google has begun discovering `aioncrypto.cloud`, based on the CEO's Search Console evidence. Exact Hostinger/Render deployed commit, health response, redirects and production route status still require browser verification.

## Local verification after the incremental changes

- Backend: 55 passed and one PostgreSQL-only test skipped locally.
- Additive migration: upgrade from `20260725_04`, `alembic check`, schema assertions and downgrade back to `20260725_04` passed against an isolated baseline schema. The CI PostgreSQL service remains the authoritative empty-database validation.
- Frontend: lint, typecheck and both production builds passed (normal production backend and the CI E2E backend origin).
- E2E: seven passed, covering public/SEO/mobile routes, cold start, invalid session, login, reload/logout and watchlist behavior.
- Security: production npm dependency audit and Python dependency audit reported no known vulnerabilities.
- Repository validation: configuration, hygiene, imports and `git diff --check` passed.

## Remaining risks

1. Production migration has not been applied and must not be applied without a current backup/rollback check.
2. There are not yet enough real, original articles for an AdSense application.
3. Email confirmation delivery is intentionally inactive, so subscribers remain pending.
4. Analytics/advertising consent behavior needs a jurisdiction-appropriate browser review before AdSense is enabled.
5. Source terms, contact aliases, Search Console, Core Web Vitals, mobile appearance, Render logs and Supabase advisors require account/browser access.
6. Render cold starts remain possible. No new worker or scheduler was added to hide that limitation.
7. Remote CI and deployed behavior must still be confirmed from the pushed Draft PR; no production deploy is part of this work.
