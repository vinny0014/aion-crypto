# Data Sources

## Market data
| Priority | Source | Use | Cost |
|---|---|---|---|
| 1 | Binance public API | prices, 24h stats, klines | $0 |
| 2 | CoinGecko | fallback prices, global metrics, coin metadata | $0 |
| 3 | TTL cache (60 s) | protects upstreams, serves repeat visits | — |
| 4 | Last-valid store | flagged `stale` when live sources fail | — |
| 5 | Explicit `unavailable` | shown honestly; never zeros/invented values | — |

No trading endpoints, no account access, no withdrawal/trade API keys — read-only public data only.

## Editorial discovery (pipeline)
Trusted RSS feeds, official project blogs, regulatory pages, official releases, GitHub releases, exchange announcements. Deduplication by URL, title, slug, content hash, similarity, entity+date. Blocked: undated content, unsourced content, spam, duplicates, low-credibility sources.

## Feed endpoint rule

The collector deliberately does not follow HTTP redirects. Every configured
source must therefore use its provider's canonical HTTPS feed endpoint and
return feed XML directly. This prevents a redirect chain from bypassing the
collector's public-host validation. Endpoint corrections are recorded in
migrations so existing source audit history is retained.
