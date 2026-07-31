# Claude Browser handoff — AION Crypto

Global rule: use only existing accounts/plans. Stop before any payment, card entry, subscription, upgrade, paid campaign, billing activation or AdSense submission while the readiness checklist is not fully approved.

## 1. GitHub

- Location: `vinny0014/aion-crypto` → Actions and Draft PR for `codex/aion-crypto-incremental-adsense`.
- Steps: confirm the branch SHA from the final engineering report; open every CI job; record configuration/backend/frontend/security/E2E result and logs for failures.
- Expected result: all required checks green, Draft PR open, no merge and no auto-merge.
- Completion test: PR head SHA equals the reported SHA and every required check is successful.
- Charging risk: do not change GitHub plan or buy Actions minutes.

## 2. Hostinger

- Location: hPanel → Websites → `aioncrypto.cloud` → current Node application/deployment.
- Steps: record current branch, commit, Node version, build/start commands and environment values without exposing secrets; do not switch production to the new branch. Validate `/`, `/news`, one nonexistent URL, `/robots.txt`, `/sitemap.xml`, `/news-sitemap.xml`, `/rss.xml`, `/ads.txt`, `/login` and `/admin`.
- Expected result: current production remains healthy; nonexistent URL is real 404; private routes are noindex; `/ads.txt` is 404 while no Google publisher ID exists.
- Completion test: screenshots/status codes recorded and existing deployment unchanged.
- Charging risk: stop before plan/add-on/domain purchase or upgrade.

## 3. Render

- Location: existing AION Crypto backend service → Events, Logs, Environment and Health.
- Steps: record deployed branch/SHA and current plan; test `/health`, `/health/live`, `/health/ready` and the Global Metrics endpoint; inspect CoinGecko errors, cache fallback and database readiness. Do not deploy the migration from the Draft PR.
- Expected result: healthy API or an evidence-backed incident; Global Metrics returns live/stale/unavailable, never invented values.
- Completion test: timestamped health responses and relevant log lines recorded.
- Charging risk: stop before upgrading service, adding worker, disk or paid monitoring.

## 4. Supabase / database

- Location: existing database project → Settings, Backups, Database, Advisors and API settings.
- Steps: record Postgres version and verify a recoverable backup; review the additive migration SQL; check whether `public` tables are exposed to Data API, existing grants/RLS and the connection role used by Render; run Security and Performance Advisors. Apply nothing during audit.
- Expected result: written GO/NO-GO for migration, including rollback and whether new tables need explicit RLS/grant treatment under the actual topology.
- Completion test: backup evidence, version, advisor results and role/exposure decision recorded.
- Charging risk: stop before plan/storage/backup upgrade.

## 5. Google Analytics

- Location: GA4 property that belongs only to `aioncrypto.cloud`.
- Steps: confirm Measurement ID matches production; verify page_view and existing custom events in Realtime/DebugView; document retention, data sharing and consent behavior. Do not create a paid product.
- Expected result: real events attributed to the official domain and privacy/cookie text matches actual collection.
- Completion test: one timestamped test session visible with no duplicate page view.
- Charging risk: none expected; stop if any paid Analytics product is offered.

## 6. Google Search Console

- Location: Domain property for `aioncrypto.cloud`.
- Steps: verify ownership; inspect `https://aioncrypto.cloud/`, `/sitemap.xml`, `/news-sitemap.xml`, one market page and one real published article when available; record indexing/canonical/robots/404/5xx findings.
- Expected result: submitted sitemaps parse successfully and Google-selected canonicals match intended URLs.
- Completion test: screenshots/export of sitemap and URL Inspection results.
- Charging risk: none; do not use bulk-indexing schemes.

## 7. AdSense

- Location: existing Google AdSense account only after every checklist blocker is cleared.
- Steps now: do not submit the site. When approved later, copy the real `ca-pub-...` client ID and `pub-...` publisher ID, confirm both share the same numeric account, review consent requirements, then configure the prepared environment fields. Validate `/ads.txt` before enabling the client switch.
- Expected result now: AdSense disabled and `/ads.txt` 404.
- Completion test later: Google recognizes ownership/ads.txt, privacy controls work and no ad is enabled before CEO approval.
- Charging risk: stop before any billing, paid ad or card action.

## 8. Contact, social and OAuth

- Contact: send/receive tests for editorial, partners, security and privacy aliases. Remove any alias that does not work before AdSense submission.
- Telegram/Discord: use official bot/webhook credentials only in the approved secret store; test a private channel first. Keep Social Outbox status `prepared` until proven.
- Facebook/Instagram/LinkedIn: verify app ownership, redirect URLs and required permissions. Do not add tokens to source code and do not create paid campaigns.
- Completion test: one non-public test per enabled channel, correct UTM, no duplicate and no token in logs.
- Charging risk: stop at every payment or advertising-budget screen.
