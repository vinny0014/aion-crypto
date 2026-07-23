# Deployment (general)

Target architecture (no Vercel; independent from AION News):
- **Frontend**: Hostinger Node.js app (`npm run build` then `npm run start`), or reverse-proxied via LiteSpeed/Nginx.
- **Backend**: Render Free preview runs `backend/scripts/start_render.sh`: Alembic runs under a PostgreSQL advisory lock, then `uvicorn` starts only after it succeeds. This is a portable preview safeguard, not the final production architecture. A paid production deployment should use a Render Pre-Deploy Command, a dedicated migration job, or a controlled CI/CD migration stage.
- **Database**: Supabase PostgreSQL free tier (`DATABASE_URL=postgresql+psycopg://…`). SQLite is development-only.
- **Storage**: Supabase Storage for article images initially; architecture allows moving to Cloudflare R2 later.

Checklist before go-live:
1. Set all production env vars (see ENVIRONMENT_VARIABLES.md); generate a strong `JWT_SECRET`.
2. Point `DATABASE_URL` at Supabase. Render Free runs `alembic -c alembic.ini upgrade head` through its versioned startup script; do not create tables manually.
3. After the API migration completes, create the first administrator once with the versioned CLI described in `FIRST_ADMIN.md`. Do not seed an administrator during build or startup.
4. Configure domain + SSL; verify `/health` and homepage provenance badges show `live`.
5. Register sitemap in Google Search Console and Bing Webmaster.
6. Do NOT enable paid AI keys until Cost Guard summary is visible in admin.

See HOSTINGER_DEPLOY.md for the provider-specific walkthrough.
