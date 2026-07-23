from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import init_db
from app.middleware import RateLimitMiddleware
from app.routers import admin, auth, cost, health, market, watchlist
from app.services.market import get_market_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
    await get_market_service().close()


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    RateLimitMiddleware,
    public_limit=settings.rate_limit_public_per_minute,
    auth_limit=settings.rate_limit_auth_per_minute,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


app.include_router(health.router)
app.include_router(market.router)
app.include_router(auth.router)
app.include_router(watchlist.router)
app.include_router(cost.router)
app.include_router(admin.router)
