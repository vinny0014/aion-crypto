# Environment Variables

Template: `.env.example` at repo root (copy into `backend/.env` and frontend env as needed).

| Variable | Where | Default | Notes |
|---|---|---|---|
| APP_ENV | backend | development | `production` on servers |
| DATABASE_URL | backend | sqlite:///./aion_crypto_dev.db | SQLite local only; Supabase PostgreSQL in production |
| JWT_SECRET | backend | empty | MUST be generated and at least 32 characters in production |
| ACCESS_TOKEN_EXPIRE_MINUTES / REFRESH_TOKEN_EXPIRE_DAYS | backend | 30 / 7 | |
| BINANCE_BASE_URL / COINGECKO_BASE_URL | backend | public endpoints | no API keys required; never trade/withdraw keys |
| MARKET_CACHE_TTL_SECONDS | backend | 60 | protects upstream APIs |
| HTTP_TIMEOUT_SECONDS | backend | 8 | upstream request timeout |
| RATE_LIMIT_PUBLIC_PER_MINUTE / RATE_LIMIT_AUTH_PER_MINUTE | backend | 120 / 10 | per-process safety layer; add an edge/shared limiter for multiple workers |
| CIRCUIT_BREAKER_FAILURE_THRESHOLD / CIRCUIT_BREAKER_RECOVERY_SECONDS | backend | 3 / 30 | provider circuit-breaker controls |
| TOTAL_API_MONTHLY_LIMIT_USD | backend | 10 | Cost Guard ceiling |
| LAST_VALID_STORE_PATH | backend | data/last_valid.json | stale-fallback store |
| FRONTEND_URL / CORS_ORIGINS | backend | local / empty | production and temporary preview browser origins |
| NEXT_PUBLIC_BACKEND_URL | frontend | unset | public Render API URL; unset produces an honest offline state |
| NEXT_PUBLIC_SITE_URL | frontend | prod: https://aioncrypto.cloud · dev: http://localhost:3000 | canonical/OG/sitemap/RSS base |
| NEXT_PUBLIC_ENABLE_INDEXING | frontend | false | keep false for every preview; enable only at approved launch |
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
