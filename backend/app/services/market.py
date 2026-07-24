"""Market data layer.

Priority chain (product rule — never fabricate numbers):
    Binance public API
    -> CoinGecko
    -> in-memory TTL cache
    -> persisted last valid value (flagged stale)
    -> explicit {"status": "unavailable"}

Every payload carries: source, fetched_at, status, and whether a fallback
was used, so the frontend can always display provenance and freshness.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Optional

import httpx

from app.cache import LastValidStore, TTLCache
from app.circuit_breaker import CircuitBreaker
from app.config import get_settings

# Static coin registry: symbol -> metadata. Prices always come from APIs;
# this only maps identity (name, coingecko id, category). Extending the
# registry is a data change, not a code change.
COIN_REGISTRY: dict[str, dict[str, str]] = {
    "BTC": {"name": "Bitcoin", "gecko_id": "bitcoin", "category": "Currency"},
    "ETH": {"name": "Ethereum", "gecko_id": "ethereum", "category": "Smart Contracts"},
    "BNB": {"name": "BNB", "gecko_id": "binancecoin", "category": "Exchange"},
    "SOL": {"name": "Solana", "gecko_id": "solana", "category": "Smart Contracts"},
    "XRP": {"name": "XRP", "gecko_id": "ripple", "category": "Payments"},
    "ADA": {"name": "Cardano", "gecko_id": "cardano", "category": "Smart Contracts"},
    "DOGE": {"name": "Dogecoin", "gecko_id": "dogecoin", "category": "Meme"},
    "LINK": {"name": "Chainlink", "gecko_id": "chainlink", "category": "Oracle"},
    "TON": {"name": "Toncoin", "gecko_id": "the-open-network", "category": "Smart Contracts"},
    "AVAX": {"name": "Avalanche", "gecko_id": "avalanche-2", "category": "Smart Contracts"},
    "DOT": {"name": "Polkadot", "gecko_id": "polkadot", "category": "Interoperability"},
    "MATIC": {"name": "Polygon", "gecko_id": "matic-network", "category": "Scaling"},
    "ATOM": {"name": "Cosmos", "gecko_id": "cosmos", "category": "Interoperability"},
    "NEAR": {"name": "NEAR Protocol", "gecko_id": "near", "category": "Smart Contracts"},
    "SUI": {"name": "Sui", "gecko_id": "sui", "category": "Smart Contracts"},
    "APT": {"name": "Aptos", "gecko_id": "aptos", "category": "Smart Contracts"},
    "ARB": {"name": "Arbitrum", "gecko_id": "arbitrum", "category": "Scaling"},
    "INJ": {"name": "Injective", "gecko_id": "injective-protocol", "category": "DeFi"},
    "LTC": {"name": "Litecoin", "gecko_id": "litecoin", "category": "Currency"},
    "UNI": {"name": "Uniswap", "gecko_id": "uniswap", "category": "DeFi"},
}

logger = logging.getLogger(__name__)

DEFAULT_TICKER_SYMBOLS = ["BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK"]


class MarketService:
    def __init__(
        self,
        cache: Optional[TTLCache] = None,
        last_valid: Optional[LastValidStore] = None,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        s = get_settings()
        self.settings = s
        self.cache = cache or TTLCache()
        self.last_valid = last_valid or LastValidStore(s.last_valid_store_path)
        self._client = client
        self.breakers: dict[str, CircuitBreaker] = {}

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.settings.http_timeout_seconds,
                headers={"Accept": "application/json", "User-Agent": "AION-Crypto/1.0 (public-market-data)"},
            )
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    # ── generic fetch-with-fallback ────────────────────────────────

    async def _fetch_json(self, url: str, params: dict | None = None) -> Any:
        client = await self._get_client()
        attempts = max(1, self.settings.http_retry_attempts)
        for attempt in range(attempts):
            try:
                resp = await client.get(url, params=params)
                # Keyless CoinGecko can transiently rate-limit by IP. Retry
                # only transient upstream failures; client errors remain
                # visible to the circuit breaker immediately.
                if resp.status_code == 429 or resp.status_code >= 500:
                    resp.raise_for_status()
                resp.raise_for_status()
                return resp.json()
            except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError):
                if attempt + 1 >= attempts:
                    raise
                await asyncio.sleep(0.25 * (2 ** attempt))

    def _wrap(self, data: Any, source: str, status: str = "live", stale: bool = False) -> dict:
        return {
            "data": data,
            "source": source,
            "status": status,
            "stale": stale,
            "fetched_at": time.time(),
        }

    async def _resolve(self, key: str, fetchers: list[tuple[str, Any]]) -> dict:
        """Run the fallback chain for a cache key.

        fetchers: ordered list of (source_name, async callable).
        """
        cached = self.cache.get(key)
        if cached is not None:
            return cached

        for source_name, fetcher in fetchers:
            breaker = self.breakers.setdefault(
                source_name,
                CircuitBreaker(
                    self.settings.circuit_breaker_failure_threshold,
                    self.settings.circuit_breaker_recovery_seconds,
                ),
            )
            if not breaker.allow_request():
                logger.warning("market provider circuit open", extra={"provider": source_name, "cache_key": key})
                continue
            try:
                data = await fetcher()
                breaker.record_success()
                wrapped = self._wrap(data, source=source_name)
                self.cache.set(key, wrapped, self.settings.market_cache_ttl_seconds)
                self.last_valid.save(key, wrapped)
                return wrapped
            except Exception as exc:
                breaker.record_failure()
                status_code = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
                logger.warning(
                    "market provider request failed provider=%s cache_key=%s error_type=%s status_code=%s",
                    source_name,
                    key,
                    type(exc).__name__,
                    status_code,
                )
                continue

        stored = self.last_valid.load(key)
        if stored is not None:
            wrapped = dict(stored["value"])
            wrapped["stale"] = True
            wrapped["status"] = "stale"
            wrapped["stored_at"] = stored["saved_at"]
            return wrapped

        return {"data": None, "source": None, "status": "unavailable", "stale": False, "fetched_at": time.time()}

    # ── endpoints ──────────────────────────────────────────────────

    async def get_ticker(self, symbols: Optional[list[str]] = None) -> dict:
        symbols = [s.upper() for s in (symbols or DEFAULT_TICKER_SYMBOLS) if s.upper() in COIN_REGISTRY]
        key = "ticker:" + ",".join(sorted(symbols))

        async def from_binance() -> list[dict]:
            pairs = "[" + ",".join(f'"{s}USDT"' for s in symbols) + "]"
            raw = await self._fetch_json(
                f"{self.settings.binance_base_url}/api/v3/ticker/24hr", params={"symbols": pairs}
            )
            by_pair = {item["symbol"]: item for item in raw}
            out = []
            for sym in symbols:
                item = by_pair.get(f"{sym}USDT")
                if not item:
                    continue
                out.append(
                    {
                        "symbol": sym,
                        "name": COIN_REGISTRY[sym]["name"],
                        "price": float(item["lastPrice"]),
                        "change_24h_pct": float(item["priceChangePercent"]),
                        "high_24h": float(item["highPrice"]),
                        "low_24h": float(item["lowPrice"]),
                        "volume_24h_quote": float(item["quoteVolume"]),
                    }
                )
            if not out:
                raise ValueError("empty binance ticker")
            return out

        async def from_coingecko() -> list[dict]:
            ids = ",".join(COIN_REGISTRY[s]["gecko_id"] for s in symbols)
            raw = await self._fetch_json(
                f"{self.settings.coingecko_base_url}/coins/markets",
                params={"vs_currency": "usd", "ids": ids},
            )
            by_id = {item["id"]: item for item in raw}
            out = []
            for sym in symbols:
                item = by_id.get(COIN_REGISTRY[sym]["gecko_id"])
                if not item or item.get("current_price") is None:
                    continue
                out.append(
                    {
                        "symbol": sym,
                        "name": COIN_REGISTRY[sym]["name"],
                        "price": float(item["current_price"]),
                        "change_24h_pct": float(item.get("price_change_percentage_24h") or 0.0),
                        "high_24h": float(item.get("high_24h") or 0.0),
                        "low_24h": float(item.get("low_24h") or 0.0),
                        "volume_24h_quote": float(item.get("total_volume") or 0.0),
                    }
                )
            if not out:
                raise ValueError("empty coingecko ticker")
            return out

        return await self._resolve(key, [("binance", from_binance), ("coingecko", from_coingecko)])

    async def get_global(self) -> dict:
        key = "global"

        async def from_coingecko() -> dict:
            raw = await self._fetch_json(f"{self.settings.coingecko_base_url}/global")
            d = raw["data"]
            return {
                "market_cap_usd": float(d["total_market_cap"]["usd"]),
                "volume_24h_usd": float(d["total_volume"]["usd"]),
                "btc_dominance_pct": float(d["market_cap_percentage"]["btc"]),
                "eth_dominance_pct": float(d["market_cap_percentage"]["eth"]),
                "market_cap_change_24h_pct": float(d.get("market_cap_change_percentage_24h_usd") or 0.0),
                "active_cryptocurrencies": int(d.get("active_cryptocurrencies") or 0),
                "markets": int(d.get("markets") or 0),
                "last_updated": int(d.get("updated_at") or 0) or None,
            }

        return await self._resolve(key, [("coingecko", from_coingecko)])

    async def get_coin(self, symbol: str) -> dict:
        symbol = symbol.upper()
        if symbol not in COIN_REGISTRY:
            return {"data": None, "source": None, "status": "not_found", "stale": False, "fetched_at": time.time()}
        key = f"coin:{symbol}"
        meta = COIN_REGISTRY[symbol]

        async def from_coingecko() -> dict:
            raw = await self._fetch_json(
                f"{self.settings.coingecko_base_url}/coins/markets",
                params={"vs_currency": "usd", "ids": meta["gecko_id"], "price_change_percentage": "1h,24h,7d"},
            )
            if not raw:
                raise ValueError("coin not returned")
            item = raw[0]
            return {
                "symbol": symbol,
                "name": meta["name"],
                "category": meta["category"],
                "price": float(item["current_price"]),
                "change_1h_pct": float(item.get("price_change_percentage_1h_in_currency") or 0.0),
                "change_24h_pct": float(item.get("price_change_percentage_24h") or 0.0),
                "change_7d_pct": float(item.get("price_change_percentage_7d_in_currency") or 0.0),
                "market_cap_usd": float(item.get("market_cap") or 0.0),
                "volume_24h_usd": float(item.get("total_volume") or 0.0),
                "circulating_supply": float(item.get("circulating_supply") or 0.0),
                "high_24h": float(item.get("high_24h") or 0.0),
                "low_24h": float(item.get("low_24h") or 0.0),
                "ath": float(item.get("ath") or 0.0),
                "image": item.get("image"),
            }

        async def from_binance() -> dict:
            item = await self._fetch_json(
                f"{self.settings.binance_base_url}/api/v3/ticker/24hr", params={"symbol": f"{symbol}USDT"}
            )
            return {
                "symbol": symbol,
                "name": meta["name"],
                "category": meta["category"],
                "price": float(item["lastPrice"]),
                "change_1h_pct": None,
                "change_24h_pct": float(item["priceChangePercent"]),
                "change_7d_pct": None,
                "market_cap_usd": None,
                "volume_24h_usd": float(item["quoteVolume"]),
                "circulating_supply": None,
                "high_24h": float(item["highPrice"]),
                "low_24h": float(item["lowPrice"]),
                "ath": None,
                "image": None,
            }

        return await self._resolve(key, [("binance", from_binance), ("coingecko", from_coingecko)])

    async def get_klines(self, symbol: str, interval: str = "1h", limit: int = 168) -> dict:
        symbol = symbol.upper()
        if symbol not in COIN_REGISTRY:
            return {"data": None, "source": None, "status": "not_found", "stale": False, "fetched_at": time.time()}
        allowed = {"15m", "1h", "4h", "1d", "1w"}
        if interval not in allowed:
            interval = "1h"
        limit = max(10, min(limit, 500))
        key = f"klines:{symbol}:{interval}:{limit}"

        async def from_binance() -> list[list[float]]:
            raw = await self._fetch_json(
                f"{self.settings.binance_base_url}/api/v3/klines",
                params={"symbol": f"{symbol}USDT", "interval": interval, "limit": limit},
            )
            # [open_time, open, high, low, close, volume]
            return [[k[0], float(k[1]), float(k[2]), float(k[3]), float(k[4]), float(k[5])] for k in raw]

        return await self._resolve(key, [("binance", from_binance)])

    async def get_markets_table(self, limit: int = 20) -> dict:
        """Full registry ticker for the markets table / heatmap / movers."""
        symbols = list(COIN_REGISTRY.keys())[:limit]
        return await self.get_ticker(symbols)


_service: Optional[MarketService] = None


def get_market_service() -> MarketService:
    global _service
    if _service is None:
        _service = MarketService()
    return _service
