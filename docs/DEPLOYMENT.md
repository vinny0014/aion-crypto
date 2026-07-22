# Deployment (general)

Target architecture (no Vercel; independent from AION News):
- **Frontend**: Hostinger Node.js app (`npm run build` then `npm run start`), or reverse-proxied via LiteSpeed/Nginx.
- **Backend**: Hostinger Node-compatible VPS slot or a small VPS running `uvicorn` behind a reverse proxy (systemd service).
- **Database**: Supabase PostgreSQL free tier (`DATABASE_URL=postgresql+psycopg://…`). SQLite is development-only.
- **Storage**: Supabase Storage for article images initially; architecture allows moving to Cloudflare R2 later.

Checklist before go-live:
1. Set all production env vars (see ENVIRONMENT_VARIABLES.md); generate a strong `JWT_SECRET`.
2. Point `DATABASE_URL` at Supabase; run schema creation (Alembic migration baseline — pending, see handoff).
3. Seed admin via `scripts/seed_admin.py` on the server.
4. Configure domain + SSL; verify `/health` and homepage provenance badges show `live`.
5. Register sitemap in Google Search Console and Bing Webmaster.
6. Do NOT enable paid AI keys until Cost Guard summary is visible in admin.

See HOSTINGER_DEPLOY.md for the provider-specific walkthrough.
