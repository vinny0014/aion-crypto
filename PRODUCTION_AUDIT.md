# AION Crypto production audit

Audit date: 2026-07-22
Decision: **NO-GO for public launch or domain connection**
Code state: **ready for review PR after Git authentication is supplied**

No DNS record was read or changed, no custom domain was attached, no production service was published, no merge was performed, and no secret value is recorded here.

## Executive finding

The supplied project is a real monorepo with intact Git metadata and a sound prototype foundation, but the Fable5 report was not fully accurate. The package contains **10 baseline commits, not 9**. Commit `c534653` exists, but the baseline HEAD is the later commit `89ac61b`. The original project also lacked migrations, configured lint, current secure dependencies, repeatable E2E coverage, production configuration guards, a real admin status surface, and working scheduler/agent entrypoints.

The review repaired the testable production-safety issues. It did not invent missing automation or editorial systems. Scheduler and agents remain explicitly `not_configured` / `not_connected`; Supabase, Hostinger and Render are not provisioned; fixture news is locked out of indexing. Those are launch blockers, not hidden successes.

## Package and Git identity

| Item | Directly observed |
|---|---|
| Uploaded archive | `upload/aion-crypto.zip`, 476,993 bytes |
| SHA-256 | `09d54d649771fbe289237ec8965a20e1da3f8ac86995b782c95021088d11c5da` |
| Extracted project | `/workspace/scratch/02f38503b04e/work/aion-crypto` |
| `.git` | Present and retained; baseline `git fsck --full --no-reflogs` found no corruption (local amended review drafts are now expected dangling objects) |
| Original branches | `main` at `89ac61b`; `develop` at `228b620` |
| Review branch | `codex/aion-crypto-production-review` |
| Original remote | None |
| Current remote | `origin https://github.com/vinny0014/aion-crypto.git` |
| GitHub repository | Exists, public, empty at inspection; connected account has admin/push permission |
| Push/PR | Blocked locally: GitHub CLI/authentication is unavailable; no force or history reconstruction attempted |

Baseline history, newest first:

1. `89ac61b` English-only policy and daily-use home anchors
2. `c534653` official domain configuration
3. `228b620` documentation and handoff
4. `055e27e` initial CI/templates
5. `2337bcd` Commander pipeline core
6. `d832b2a` public pages
7. `11d2fb1` mockup-based home
8. `0cd0536` frontend foundation
9. `e9dfb7d` backend foundation
10. `8087240` monorepo initialization

The source archive remains intact. The review did not run `git init`, rewrite commits, squash, force-push, or touch another repository.

## Security audit

The scan covered the working tree and signature patterns in all supplied revisions. Values were never printed into this report.

| Type | File | Risk | Correction / disposition |
|---|---|---|---|
| Generated SQLite state | `backend/aion_crypto_dev.db` in extracted workspace | Local state could be accidentally packaged or mistaken for production data | Removed only from the extracted working copy; already ignored; original ZIP preserved |
| Tracked compiler cache | `frontend/tsconfig.tsbuildinfo` | Build-path leakage, noisy diffs and stale type state | Removed from Git and `*.tsbuildinfo` added to `.gitignore` |
| Credential placeholders | `.env.example`, tests and auth/config modules | Search-term hits could be mistaken for real secrets | Verified as placeholders/variable names; no real token, API key, password or private key found |
| Development local URLs | `.env.example`, backend development defaults, documentation | Accidental production localhost configuration | Frontend runtime fallbacks removed; production config now rejects localhost/non-HTTPS frontend URLs and SQLite |
| Cross-project/provider words | documentation and validation tests | Branding or provider drift | No active AION News/Wordbet reference and no operational Vercel dependency; validation fails CI if cross-project terms enter active code |
| Vulnerable JavaScript dependencies | `frontend/package*.json` | Known Next.js/PostCSS/Sharp advisories | Upgraded to Next.js `15.5.21` maintenance LTS and remediated transitive pins; `npm audit` reports 0 |
| Vulnerable Python dependencies | `backend/requirements.txt` | PyJWT, multipart, Starlette and pytest advisories | Upgraded compatible pins; `pip-audit` reports no known vulnerabilities; 28 tests still pass |
| Missing browser/server hardening | frontend/backend configuration | Clickjacking, MIME sniffing, permissive browser capabilities | Added CSP, HSTS, COOP, frame, referrer, permissions and MIME headers; backend sends core security headers |
| Generated/build directories | local `node_modules`, `.next`, `.venv`, test reports | Size, supply-chain noise and accidental commits | Ignored and absent from the supplied tracked tree; CI always installs from lock/pins |

No real `.env`, private key block, Binance secret, Supabase service-role credential, PostgreSQL credential, personal-data file, internal ZIP, or tracked file over 5 MB was found. A full Gitleaks job is configured against full history, but it cannot be called green until GitHub Actions runs.

## Frontend audit

| Control | Result |
|---|---|
| Clean install | `npm ci` passed from the lockfile |
| Dependency audit | 0 vulnerabilities |
| Lint | ESLint 9 flat configuration, 0 warnings/errors |
| Typecheck | `tsc --noEmit` passed |
| Production build | Next.js 15.5.21 standalone build passed; 39 static pages plus dynamic routes/endpoints |
| E2E | Main user routes, SEO documents, health, console/page errors, headers and responsive widths passed |
| Accessibility | Axe found 0 serious/critical violations on Home; manual assistive-technology review remains required |
| Language | Tested UI is English; `<html lang="en">` and `en_US` metadata |
| Loading/error/empty | Root loading and error boundaries plus explicit offline, signed-out, forbidden and empty admin states |
| Responsive | 1440/768/390 CSS viewports captured; page-level horizontal overflow regression fixed and tested |
| Admin | Protected overview for queue, incidents and Cost Guard; honestly exposes disconnected scheduler/agents |
| Watchlist | Functional only in browser `localStorage`; not yet tied to authenticated Supabase users |
| Market charts/data | SVG charts render from wrapped payloads; offline fixtures are visibly labeled; live outbound providers could not be reached from this sandbox |

E2E page coverage: Home, Markets, BTC coin page, News, Article, Search, Watchlist, Login and Admin. Endpoint coverage: `/health`, robots, standard/news/image sitemaps and RSS. Browser console and uncaught page errors were empty during the run.

### SEO and publication lock

- Canonical, Open Graph, Twitter Cards and Organization/WebSite Schema.org use only `https://aioncrypto.cloud`.
- `NEXT_PUBLIC_ENABLE_INDEXING=false` is the default. Robots and metadata block indexing in every preview.
- Fixture news and article pages remain `noindex`; fixture articles were removed from sitemap, news sitemap, image sitemap and RSS publication output.
- 404 and application error boundaries exist.
- The domain configuration is present in code, but the domain is not published.

## Backend audit

| Control | Result |
|---|---|
| Clean dependency resolution | Pinned FastAPI 0.139.2 stack installs; `pip-audit` clean |
| Startup | Real Uvicorn process reached application startup and shut down cleanly |
| Health | `/health`, `/health/live`, `/health/ready`; readiness validates the database and returns 503 on failure |
| Database | SQLite only for development/tests; production config requires PostgreSQL |
| Migrations | Alembic baseline upgrades an empty DB; `alembic check` reports no drift |
| Authentication | bcrypt, signed access/refresh JWTs, active-user check and role guard; production rejects weak/missing JWT secret |
| Queue | Persistent Commander claim, bounded cycle, recovery and dead-letter behavior |
| Retry/backoff | Exponential availability delay is stored and regression tested |
| Idempotency | Unique idempotency key and regression test; no public enqueue endpoint exists yet |
| Circuit breaker | Per-provider threshold/recovery logic integrated and tested |
| Market APIs | Binance public primary, CoinGecko fallback, TTL and last-valid stale fallback; mocked paths pass |
| Rate limiting | Login/public API process-local limit with `Retry-After`; a shared edge/distributed limiter is still required for multiple workers |
| CORS | Explicit configured origins; production frontend must be public HTTPS |
| Cost Guard | Monthly ledger, bands, blocking and protected overview tested; no paid agent integration exists yet |
| Scheduler | **Absent — launch blocker for automation** |
| Agents | **No registered production handlers — launch blocker for automated editorial operation** |
| Monitoring | Incident model/status view and logs exist; no external alert sink, SLO monitor or recovery daemon is connected |

The live Binance/CoinGecko probe returned `unavailable` because outbound provider hosts are restricted in this execution environment. No market values were fabricated. Live preview verification is mandatory.

## Test evidence

| Suite | Result |
|---|---|
| Backend pytest | 28 passed |
| Empty-database migration | upgrade passed |
| Migration drift | no new upgrade operations |
| Backend dependency audit | no known vulnerabilities |
| Frontend npm audit | 0 vulnerabilities |
| Frontend lint | passed |
| Frontend typecheck | passed |
| Frontend production build | passed, standalone output |
| Playwright E2E | 1 consolidated scenario passed, covering 9 pages, 6 endpoints and 3 viewports |
| Repository validation | official identity, indexing lock, hygiene and cross-project checks passed |
| GitHub Actions | **not run — branch not pushed** |

## Visual decision

The three screenshots are committed under `docs/screenshots/` and documented in `docs/VISUAL_AUDIT.md`. The official mockup image was not present in the ZIP or available attachments. Structural checklist coverage is ~85%; pixel fidelity is not measurable. Mobile navigation is usable but dense. No 95% claim is made.

## Production decision record

| # | Requested item | Decision |
|---:|---|---|
| 1 | Project path | `/workspace/scratch/02f38503b04e/work/aion-crypto` |
| 2 | `.git` | Present, valid and preserved |
| 3 | History | 10 baseline commits validated; Fable5 count of 9 disproved |
| 4 | Initial commit | Repository root `8087240`; audit baseline HEAD `89ac61b` |
| 5 | Final commit | Review branch tip; resolve with `git rev-parse HEAD` after the report commit |
| 6 | Branch | `codex/aion-crypto-production-review` |
| 7 | Remote | Official HTTPS origin connected |
| 8 | GitHub | Public empty repository exists; push auth blocked |
| 9 | PR | Not created; impossible before branch push |
| 10 | Tests | 28 backend tests passed; regression coverage added |
| 11 | Build | Next production standalone build passed |
| 12 | E2E | Passed locally with route, SEO, console, accessibility and responsive checks |
| 13 | Security | No secret found; dependency audits clean; historical Gitleaks pending CI |
| 14 | Frontend | Review-ready preview build; real CMS/data still required for launch |
| 15 | Backend | API core hardened; scheduler/agents/monitor remain incomplete |
| 16 | Database | Alembic ready; Supabase unprovisioned/unverified |
| 17 | APIs | Mocked chain verified; live outbound check blocked by sandbox |
| 18 | Agents | Not connected; no false healthy status |
| 19 | Cost Guard | Tested and surfaced; paid-provider integration absent |
| 20 | SEO | Complete metadata surface, preview indexing safely disabled |
| 21 | Visual | Screenshots complete; objective mockup comparison blocked by missing reference |
| 22 | Preview | Local standalone preview validated; Hostinger/Render previews not created without account access and pushed GitHub branch |
| 23 | Costs | Detailed in `HOSTINGER_DEPLOY_PLAN.md`; no spend incurred by this review |
| 24 | Risks | Missing automation/CMS/live integrations, process-local limiter, no remote CI, mobile density |
| 25 | Human pending | Git auth, PR/CI, provider projects/secrets, mockup, content approval, preview acceptance |
| 26 | Domain condition | Only after PR/CI and temporary preview approval, real data/content, backup/rollback tests, security/visual acceptance and an explicit human go-live instruction |

## Stop conditions still open

This stage is not complete under the requested stop rule because the branch cannot be pushed without an authenticated GitHub CLI/session, so CI and PR do not yet exist. Hostinger/Render/Supabase credentials were not supplied, and creating a public preview is an external deployment action requiring those connected accounts. These blockers do not authorize DNS or domain changes.
