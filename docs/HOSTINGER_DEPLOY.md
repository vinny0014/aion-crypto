# Hostinger deploy summary

The authoritative, preview-first runbook is [`../HOSTINGER_DEPLOY_PLAN.md`](../HOSTINGER_DEPLOY_PLAN.md).

Frontend contract:

- Hostinger Node.js Web App, project root `frontend/`, Node 22.
- Install/build: `npm ci && npm run build`.
- Start: `npm run start` (`PORT` is read by the standalone Next.js server).
- Health: `GET /health`.
- Preview keeps `NEXT_PUBLIC_ENABLE_INDEXING=false`, uses Hostinger's temporary domain, and does not attach `aioncrypto.cloud`.

Backend contract:

- Separate Render Python web service from `render.yaml`.
- Alembic migration runs before deployment; readiness is `GET /health/ready`.
- Supabase PostgreSQL remains a separate managed service.
- No scheduler or agent worker may be provisioned until a real runnable entrypoint and handler set exist.

The official domain and DNS must remain unchanged until every approval gate in the root deploy plan is satisfied.
