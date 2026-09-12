# AION Guardian 24x7

The AION Guardian is the always-on production safety layer for AION Crypto.

## Cadence

- Lightweight public production checks: every 15 minutes through GitHub Actions.
- ChatGPT AION Guardian condition watch: hourly, for investigation and safe corrective actions when the deterministic guard detects a problem.
- Full browser AdSense preflight remains the release gate and runs from the production-validation workflow.

## Public checks

The deterministic guard validates:

- canonical home availability and identity;
- the six AdSense content pillars (BTC, ETH, XRP, SOL, BNB and ADA);
- no-cache/no-store behavior on pillar pages to avoid stale HTML/chunk mismatches;
- trust/legal pages;
- exact Google `ads.txt` publisher record;
- `robots.txt` without a blanket crawl block;
- sitemap coverage for all six pillars;
- backend readiness/database health;
- `coordination_dispatch_retry=true` health marker;
- frontend/backend release fingerprints when available.

## Automatic remediation

Only safe and reversible recovery is automatic:

1. restore the exact authorized `frontend/public/ads.txt` record if source control is wrong;
2. trigger one empty production-branch commit to force Hostinger/Render redeployment when production is unhealthy;
3. enforce a six-hour redeploy cooldown to prevent loops;
4. record evidence in GitHub issue #35.

The guardian does **not** automatically change DNS, secrets, billing, Google account settings, AdSense review status, Auto Ads, or editorial claims. Problems requiring login/MFA/CAPTCHA, policy judgment, destructive actions or new cost are escalated instead.

## AdSense boundary

The Guardian keeps the public technical readiness surface healthy, but it cannot guarantee Google approval. AdSense editorial/policy decisions and authenticated account actions remain external gates.
