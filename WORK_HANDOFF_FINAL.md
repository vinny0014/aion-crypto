# AION Crypto — final production-review handoff

Prepared: 2026-07-22
Branch: `codex/aion-crypto-production-review`
Target PR: `codex/aion-crypto-production-review` → `main`
Launch status: **blocked; do not connect the domain**

## What is complete locally

- The original `.git` and 10-commit baseline history are preserved.
- Commit `c534653` and the later baseline HEAD `89ac61b` were validated.
- Security scans found no real secret; generated DB/cache artifacts were removed or ignored.
- Vulnerable frontend and backend dependencies were upgraded; npm and pip audits are clean.
- Backend production validation, rate limiting, circuit breaker, idempotency key, real backoff, PostgreSQL driver, Alembic baseline and readiness endpoints were added.
- Backend startup, empty-DB migration, migration drift and 28 tests pass.
- Frontend lint/typecheck/standalone build pass from a clean install.
- Playwright covers the main routes, health/SEO documents, console errors, CSP, accessibility blockers and 1440/768/390 responsiveness.
- Desktop/tablet/mobile screenshots and an honest visual audit are present.
- Indexing remains off; fixtures do not populate publication feeds.
- Hostinger/Render/Supabase configuration and rollback gates are documented.
- GitHub Actions defines configuration, backend, frontend, security and E2E jobs.

## What is not complete

| Blocker | Current truth | Owner/action |
|---|---|---|
| Git push | Official public repository exists but is empty; native push lacks authenticated GitHub CLI/session | Authenticate `gh` for `vinny0014`, then continue without force |
| PR and CI | Cannot exist before the branch is pushed | Create draft PR, wait for all five jobs, fix any remote-only failure |
| Hostinger preview | No hPanel account/session was supplied | Connect GitHub review branch and use the temporary Hostinger domain only |
| Render preview | No Render account/project exists in scope | Apply `render.yaml` to the review branch |
| Supabase | No project or credential was supplied | Create isolated preview project, migrate, seed admin, test backup/restore |
| Live market APIs | Sandbox blocks provider hosts | Validate Binance primary and CoinGecko fallback on deployed preview |
| Scheduler | No runnable production scheduler entrypoint exists | Implement and test, or remove automation from launch scope |
| Agents | No production handlers are registered | Define real sources/CMS/workflows before implementing |
| CMS/editorial | Articles are fixtures | Supply approved real content and publication workflow |
| Official mockup | Not present in ZIP/attachments | Attach reference and approve objective three-width comparison |
| Domain/DNS | Intentionally untouched | New explicit go-live authorization only after every gate passes |

## Continue commands after GitHub authentication

Run from `/workspace/scratch/02f38503b04e/work/aion-crypto`:

```bash
gh auth status
git status --short
git log --oneline --decorate -15
git push -u origin main
git push -u origin codex/aion-crypto-production-review
```

The first push publishes only the unchanged supplied `main`; corrections remain on the review branch. Do not use force. Then create a **draft** PR to `main`, monitor GitHub Actions, and do not merge.

## Validation commands

Backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m pytest
DATABASE_URL=sqlite:////tmp/aion-crypto-ci.db python -m alembic -c alembic.ini upgrade head
DATABASE_URL=sqlite:////tmp/aion-crypto-ci.db python -m alembic -c alembic.ini check
python -m pip_audit -r requirements.txt
```

Frontend:

```bash
cd frontend
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm run build
npm run e2e
```

Repository contract:

```bash
python scripts/validate_project.py
git diff --check
git fsck --full --no-reflogs
```

## Handoff decision

The reviewed code is suitable for a draft PR and temporary infrastructure preview. It is **not production-ready as an operating crypto publication** because automation, real content, persistent user features, live-provider validation, external monitoring and provider infrastructure are incomplete.

Required launch sequence:

1. Authenticate and push without rewriting history.
2. Obtain green CI and approved draft PR; do not merge yet.
3. Deploy isolated Supabase and Render previews.
4. Deploy Hostinger temporary-domain preview from the review branch.
5. Complete real-data, CMS, visual, accessibility, performance, backup and rollback acceptance.
6. Decide scheduler/agent scope honestly.
7. Merge only after review approval.
8. Request a separate explicit authorization before any DNS/domain action.

No step in this handoff authorizes publishing `aioncrypto.cloud`.
