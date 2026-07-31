# AION Crypto — AdSense readiness checklist

Overall status: **blocked — do not submit to AdSense yet**.

| Check | Status | Evidence / required proof |
|---|---|---|
| Existing architecture preserved | Approved | Incremental diff reuses current Next.js, FastAPI, DB, auth, admin, routes and visual components |
| Canonical metadata | Approved in code | Root and page metadata use the official site URL; validate rendered production tags |
| robots.txt | Approved in code | Production allows public content and blocks admin/login; preview indexing remains configurable |
| General sitemap | Approved in code | Static public URLs plus database-published, non-fixture articles only |
| News sitemap | Approved in code | Only published records from the last 48 hours |
| RSS | Approved in code | Only database-published records; valid empty feed while no articles exist |
| Image sitemap | Pending | Remains empty until rights-cleared article images exist |
| NewsArticle + BreadcrumbList | Approved in code | Full dates, organizational author/publisher, canonical and optional image |
| Open Graph/Twitter cards | Approved in code | Database title, summary, dates and validated optional image |
| Real 404, legacy redirects and private-route noindex | Approved in code | Generic missing routes return 404; former fixture article URLs permanently redirect to `/news`; missing dynamic articles call `notFound`; admin/login/watchlist/search are noindex |
| Institutional pages | Approved in code | Core pages preserved; missing cookie/methodology/publisher/author/DMCA/accessibility pages added |
| Contact channels | Requires browser | Send and receive a test for every displayed `@aioncrypto.cloud` alias |
| Original sourced content | Blocked | Fixtures no longer appear as news; publish a meaningful body of real reviewed articles |
| Fixture/thin/duplicate protection | Approved in code | Publication API excludes fixtures; deterministic pipeline gates and tests cover duplicates/thin content |
| Newsletter consent storage | Approved in code | Explicit consent, preferences, hashed tokens, honeypot, rate limit and export |
| Newsletter confirmation delivery | Pending | No safe zero-cost email delivery is connected; keep subscribers pending |
| Social distribution | Pending manual | Outbox/UTMs/copy are ready; no OAuth or external send is enabled |
| Analytics identity/data | Requires browser | Verify real GA4 property, events, privacy disclosure and consent behavior |
| Search Console | Requires browser | Validate ownership, sitemaps, canonicals, coverage, 4xx/5xx and indexed article examples |
| Mobile/Core Web Vitals/accessibility | Requires browser | Run production Lighthouse/field checks and manual assistive-technology review |
| Global Metrics degraded state | Approved in code | Existing CoinGecko→cache→last-valid→unavailable chain preserved; no invented zero |
| Supabase schema/advisors | Requires browser | Backup, Postgres version, migration dry run, Data API exposure, RLS and security/performance advisors |
| AdSense bootstrap | Approved but disabled | `NEXT_PUBLIC_ADSENSE_ENABLED=false`; invalid/missing IDs render no script |
| ads.txt | Approved but disabled | `/ads.txt` returns 404 until a valid real `pub-` ID is configured |
| Publisher/client IDs | Blocked | Never invent; obtain from the approved AdSense account only |
| Cookie/advertising consent | Blocked | Final consent implementation/review must precede advertising enablement |
| Content/image rights | Blocked | Record rights and source evidence for every indexed image/article |
| Cost ceiling | Approved in code | R$300 ceiling, approximate R$250 baseline, zero new service and paid integrations disabled |
| Local tests and security audits | Approved | 55 backend tests passed (one PostgreSQL-only skip), frontend lint/typecheck/build passed, seven E2E passed, and npm/Python audits found no known vulnerabilities |
| Remote CI and deploy | Pending | Branch must push and Draft PR CI must finish green; production deploy is not part of this PR |

## AdSense activation configuration

Keep all values empty/false until the checklist is approved:

```text
NEXT_PUBLIC_ADSENSE_ENABLED=false
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
ADSENSE_PUBLISHER_ID=
```

The numeric account portion of `ca-pub-...` and `pub-...` must match. Enabling the client without a valid ID renders no script; omitting the publisher ID keeps `/ads.txt` at HTTP 404. No fake ad slot or test publisher is included.
