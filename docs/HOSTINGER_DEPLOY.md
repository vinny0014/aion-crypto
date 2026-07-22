# Hostinger Deploy

## Frontend (Next.js)
1. Create a Node.js application (Node 22) in hPanel; set root to `frontend/`.
2. Build command: `npm ci && npm run build`. Start command: `npm run start -- -p $PORT`.
3. Env vars: `NEXT_PUBLIC_SITE_URL=https://aioncrypto.cloud`, `BACKEND_URL=https://api.aioncrypto.cloud` (or the backend URL you provision), `NEXT_PUBLIC_BACKEND_URL` matching it.
4. Attach the domain and enable SSL.

## Backend (FastAPI)
Hostinger shared Node hosting does not run Python; use one of:
- **Hostinger VPS** (recommended): `python3.12 -m venv`, `pip install -r requirements.txt`, run `uvicorn app.main:app --host 127.0.0.1 --port 8000` under systemd, reverse-proxy `api.your-domain` → 8000 with Nginx/LiteSpeed, SSL via certbot.
- Or any small compatible Python host — keeping it separate from any AION News infrastructure.

## Database
Supabase free project → copy the pooled connection string into `DATABASE_URL` (`postgresql+psycopg://`). Add `psycopg[binary]` to requirements when switching.

## Cost expectation (initial phase)
Hostinger promo plan + Supabase $0 + Binance/CoinGecko public $0 + GA4 $0 + monitoring $0 + paid text/image APIs ≤ US$10/mo → roughly R$40–65/mo. Do not add paid services without explicit authorization.

> Official domain: **https://aioncrypto.cloud** (deploy target: Hostinger). Do not change DNS or publish until explicitly instructed; this document only prepares the configuration.
