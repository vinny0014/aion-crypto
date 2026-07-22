# Cost Policy (Cost Guard)

Hard ceiling: `TOTAL_API_MONTHLY_LIMIT_USD = 10`.

| Monthly spend | Band | Allowed paid priorities |
|---|---|---|
| < $7 | NORMAL | all |
| $7–<$9 | ECONOMY | medium, high, essential |
| $9–<$10 | ESSENTIAL_ONLY | essential |
| ≥ $10 | BLOCKED | none (raises CostBlockedError) |

Every paid call is recorded in `cost_ledger`: provider, model, agent, task, tokens in/out, images, estimated cost, result, retries, timestamp. Admin summary at `GET /api/v1/cost/summary` (admin/editor only).

Resource priority: code → templates → cache → database → RSS → free APIs → paid AI last.
Paid calls are NEVER made for: health checks, monitoring, scheduler, price data, logs, sitemaps, RSS, analytics, simple validations.
