"""Central configuration. All values overridable via environment / .env."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AION Crypto"
    app_env: str = "development"
    frontend_url: str = "http://localhost:3000"

    database_url: str = "sqlite:///./aion_crypto_dev.db"

    jwt_secret: str = "dev-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    binance_base_url: str = "https://api.binance.com"
    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    market_cache_ttl_seconds: int = 60
    http_timeout_seconds: float = 8.0

    total_api_monthly_limit_usd: float = 10.0

    last_valid_store_path: str = "data/last_valid.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
