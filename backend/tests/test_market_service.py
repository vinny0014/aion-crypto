"""Market service fallback-chain tests with a fake HTTP client (no network)."""
import asyncio
import json

import httpx
import pytest

from app.cache import LastValidStore, TTLCache
from app.services.market import MarketService

BINANCE_TICKER = [
    {
        "symbol": "BTCUSDT", "lastPrice": "66853.21", "priceChangePercent": "1.32",
        "highPrice": "67000", "lowPrice": "65000", "quoteVolume": "98450000000",
    },
    {
        "symbol": "ETHUSDT", "lastPrice": "3472.11", "priceChangePercent": "0.87",
        "highPrice": "3500", "lowPrice": "3400", "quoteVolume": "20450000000",
    },
]

GECKO_MARKETS = [
    {
        "id": "bitcoin", "current_price": 66700.0, "price_change_percentage_24h": 1.1,
        "high_24h": 67000, "low_24h": 65000, "total_volume": 9.8e10,
    },
]

GECKO_GLOBAL = {
    "data": {
        "total_market_cap": {"usd": 2.48e12},
        "total_volume": {"usd": 9.845e10},
        "market_cap_percentage": {"btc": 52.3, "eth": 17.1},
        "market_cap_change_percentage_24h_usd": 1.25,
        "active_cryptocurrencies": 12000,
    }
}


def make_client(routes: dict[str, object], fail_urls: set[str] = frozenset()):
    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url).split("?")[0]
        if url in fail_urls:
            return httpx.Response(500, text="boom")
        for prefix, payload in routes.items():
            if url.startswith(prefix):
                return httpx.Response(200, text=json.dumps(payload))
        return httpx.Response(404, text="not found")

    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def svc_with(routes, fail_urls=frozenset(), tmp_path=None):
    return MarketService(
        cache=TTLCache(),
        last_valid=LastValidStore(str(tmp_path / "lv.json")),
        client=make_client(routes, fail_urls),
    )


def test_ticker_binance_primary(tmp_path):
    svc = svc_with({"https://api.binance.com/api/v3/ticker/24hr": BINANCE_TICKER}, tmp_path=tmp_path)
    result = asyncio.run(svc.get_ticker(["BTC", "ETH"]))
    assert result["status"] == "live"
    assert result["source"] == "binance"
    prices = {r["symbol"]: r["price"] for r in result["data"]}
    assert prices["BTC"] == pytest.approx(66853.21)


def test_ticker_falls_back_to_coingecko(tmp_path):
    svc = svc_with(
        {"https://api.coingecko.com/api/v3/coins/markets": GECKO_MARKETS},
        fail_urls={"https://api.binance.com/api/v3/ticker/24hr"},
        tmp_path=tmp_path,
    )
    result = asyncio.run(svc.get_ticker(["BTC"]))
    assert result["source"] == "coingecko"
    assert result["data"][0]["price"] == pytest.approx(66700.0)


def test_ticker_serves_stale_last_valid_when_all_sources_fail(tmp_path):
    lv = LastValidStore(str(tmp_path / "lv.json"))
    good = svc_with({"https://api.binance.com/api/v3/ticker/24hr": BINANCE_TICKER}, tmp_path=tmp_path)
    good.last_valid = lv
    asyncio.run(good.get_ticker(["BTC", "ETH"]))  # populates last-valid

    bad = MarketService(
        cache=TTLCache(),
        last_valid=lv,
        client=make_client({}, fail_urls={
            "https://api.binance.com/api/v3/ticker/24hr",
            "https://api.coingecko.com/api/v3/coins/markets",
        }),
    )
    result = asyncio.run(bad.get_ticker(["BTC", "ETH"]))
    assert result["status"] == "stale"
    assert result["stale"] is True
    assert result["data"][0]["price"] == pytest.approx(66853.21)


def test_unavailable_when_nothing_ever_succeeded(tmp_path):
    svc = svc_with({}, fail_urls={
        "https://api.binance.com/api/v3/ticker/24hr",
        "https://api.coingecko.com/api/v3/coins/markets",
    }, tmp_path=tmp_path)
    result = asyncio.run(svc.get_ticker(["BTC"]))
    assert result["status"] == "unavailable"
    assert result["data"] is None  # never zeros, never fabricated numbers


def test_global_metrics(tmp_path):
    svc = svc_with({"https://api.coingecko.com/api/v3/global": GECKO_GLOBAL}, tmp_path=tmp_path)
    result = asyncio.run(svc.get_global())
    assert result["status"] == "live"
    assert result["data"]["btc_dominance_pct"] == pytest.approx(52.3)


def test_unknown_coin_is_not_found(tmp_path):
    svc = svc_with({}, tmp_path=tmp_path)
    result = asyncio.run(svc.get_coin("NOTACOIN"))
    assert result["status"] == "not_found"


def test_cache_prevents_second_fetch(tmp_path):
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(200, text=json.dumps(BINANCE_TICKER))

    svc = MarketService(
        cache=TTLCache(),
        last_valid=LastValidStore(str(tmp_path / "lv.json")),
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    asyncio.run(svc.get_ticker(["BTC", "ETH"]))
    asyncio.run(svc.get_ticker(["BTC", "ETH"]))
    assert calls["n"] == 1
