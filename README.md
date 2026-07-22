# AION Crypto

**Crypto Market Intelligence** — a professional crypto market portal: real-time market data, charts, news, analysis, guides, watchlist and an admin/automation foundation. Fully independent from AION News (separate repo, database, hosting, secrets and operations).

## Monorepo layout

```
/frontend   Next.js 14 (App Router, TypeScript, Tailwind) — public site + admin shell
/backend    FastAPI (Python 3.12) — market data API, cache, cost guard, editorial pipeline foundation
/docs       Architecture, deployment, policies, runbooks, handoff
/scripts    Dev/ops helper scripts
/tests      Cross-cutting/E2E test entrypoints (unit tests live inside each app)
/.github    CI workflows, PR/issue templates
```

## Quick start

Backend:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

The frontend works even with the backend offline: every market block degrades to cached/fixture data labeled with its source and freshness. No invented prices — real API data is always labeled `binance`/`coingecko`; fallback content is labeled `fixture` / "Data temporarily unavailable".

## Key documents

- `docs/ARCHITECTURE.md` — system design
- `docs/ENVIRONMENT_VARIABLES.md` — every variable explained
- `docs/HOSTINGER_DEPLOY.md` — target hosting (no Vercel)
- `docs/COST_POLICY.md` — Cost Guard bands and rules (US$10/month API ceiling)
- `docs/WORK_HANDOFF.md` — full handoff for the GPT Work review stage
- `docs/VISUAL_AUDIT.md` — mockup fidelity tracking

## Non-goals / hard rules

- No trading execution, no exchange account access, no withdrawal/trade API keys.
- No personalized financial advice; every market page carries a disclaimer.
- No fabricated prices, volumes, market caps or analytics numbers — ever.
- Independent from AION News in every dimension (code, infra, DB, domain, secrets).
