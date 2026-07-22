# Environment Variables

Template: `.env.example` at repo root (copy into `backend/.env` and frontend env as needed).

| Variable | Where | Default | Notes |
|---|---|---|---|
| APP_ENV | backend | development | `production` on servers |
| DATABASE_URL | backend | sqlite:///./aion_crypto_dev.db | SQLite local only; Supabase PostgreSQL in production |
| JWT_SECRET | backend | dev-only value | MUST be a long random string in production |
| ACCESS_TOKEN_EXPIRE_MINUTES / REFRESH_TOKEN_EXPIRE_DAYS | backend | 30 / 7 | |
| BINANCE_BASE_URL / COINGECKO_BASE_URL | backend | public endpoints | no API keys required; never trade/withdraw keys |
| MARKET_CACHE_TTL_SECONDS | backend | 60 | protects upstream APIs |
| TOTAL_API_MONTHLY_LIMIT_USD | backend | 10 | Cost Guard ceiling |
| LAST_VALID_STORE_PATH | backend | data/last_valid.json | stale-fallback store |
| BACKEND_URL | frontend (server) | http://localhost:8000 | |
| NEXT_PUBLIC_BACKEND_URL | frontend (client) | http://localhost:8000 | used by login page |
| NEXT_PUBLIC_SITE_URL | frontend | prod: https://aioncrypto.cloud · dev: http://localhost:3000 | canonical/OG/sitemap/RSS base |
| PUBLIC_SITE_URL | infra | https://aioncrypto.cloud | official production domain |
| CANONICAL_URL | infra | https://aioncrypto.cloud | must equal PUBLIC_SITE_URL |
| VITE_GA_MEASUREMENT_ID | frontend | empty | analytics stays OFF while empty — never use a fake ID |
| SMTP_* | backend | empty | newsletter sending disabled until configured |
| ANTHROPIC_API_KEY | backend | empty | paid content generation disabled until configured; goes through Cost Guard |

## Official domain

The single official production domain is **https://aioncrypto.cloud**. It is used for
canonical URLs, Open Graph, Twitter Cards, Schema.org, sitemap.xml, news-sitemap.xml,
image-sitemap.xml, robots.txt and RSS. Development and preview environments must set
`NEXT_PUBLIC_SITE_URL` explicitly; production builds fall back to the official domain.
Never use another project's subdomain or a temporary hardcoded URL.
