from fastapi import APIRouter, Query

from app.services.market import COIN_REGISTRY, get_market_service

router = APIRouter(prefix="/api/v1/market", tags=["market"])


@router.get("/ticker")
async def ticker(symbols: str | None = Query(default=None, description="Comma-separated, e.g. BTC,ETH")):
    svc = get_market_service()
    parsed = [s.strip() for s in symbols.split(",")] if symbols else None
    return await svc.get_ticker(parsed)


@router.get("/global")
async def global_metrics():
    return await get_market_service().get_global()


@router.get("/table")
async def markets_table(limit: int = Query(default=20, ge=1, le=50)):
    return await get_market_service().get_markets_table(limit)


@router.get("/coins/{symbol}")
async def coin(symbol: str):
    return await get_market_service().get_coin(symbol)


@router.get("/klines/{symbol}")
async def klines(symbol: str, interval: str = "1h", limit: int = 168):
    return await get_market_service().get_klines(symbol, interval, limit)


@router.get("/registry")
async def registry():
    return {"data": [{"symbol": s, **m} for s, m in COIN_REGISTRY.items()], "status": "live", "source": "registry"}
