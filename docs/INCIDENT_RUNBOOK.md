# Incident Runbook

## Market data shows "stale" or "unavailable"
1. `curl backend/health` — if DB down, check DATABASE_URL/Supabase status.
2. Test upstreams directly: `curl https://api.binance.com/api/v3/ping`, CoinGecko `/ping`.
3. If upstreams are rate-limiting: TTL cache should absorb; check `MARKET_CACHE_TTL_SECONDS` wasn't lowered.
4. Stale is safe-by-design (last real value, flagged). Do not "fix" by injecting numbers.

## Pipeline tasks piling up / dead-letter growth
1. Inspect `tasks` table: `status='dead'` rows contain `last_error` tracebacks.
2. Fix root cause, then requeue: set status back to `queued`, attempts to 0.
3. Commander recovers `running` tasks stuck >10 min automatically each cycle.

## Auth failures
- 401 on valid creds → check JWT_SECRET consistency across restarts.
- Locked out → run `scripts/seed_admin.py` with a new admin (then remove it).

## Cost band escalated
- `GET /api/v1/cost/summary`; inspect `cost_ledger` for the runaway agent/task; the band system already throttles automatically. Never raise the limit mid-month to "unblock".
