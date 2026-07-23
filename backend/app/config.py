"""Central configuration. All values are overridable via environment / .env."""
from functools import lru_cache
from urllib.parse import urlparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AION Crypto"
    app_short_name: str = "AIONCRYPTO"
    tagline: str = "Crypto Market Intelligence"
    app_env: str = "development"
    frontend_url: str = "http://localhost:3000"
    public_site_url: str = "https://aioncrypto.cloud"
    cors_origins: str = ""

    database_url: str = "sqlite:///./aion_crypto_dev.db"

    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Binance documents this market-data-only host for public endpoints. It
    # intentionally cannot be used for account or trading operations.
    binance_base_url: str = "https://data-api.binance.vision"
    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    market_cache_ttl_seconds: int = 60
    http_timeout_seconds: float = 8.0
    http_retry_attempts: int = 2

    total_api_monthly_limit_usd: float = 10.0

    last_valid_store_path: str = "data/last_valid.json"
    rate_limit_public_per_minute: int = 120
    rate_limit_auth_per_minute: int = 10
    circuit_breaker_failure_threshold: int = 3
    circuit_breaker_recovery_seconds: int = 30

    def allowed_origins(self) -> list[str]:
        values = [self.frontend_url, *self.cors_origins.split(",")]
        return list(dict.fromkeys(value.strip().rstrip("/") for value in values if value.strip()))

    @model_validator(mode="after")
    def validate_production(self) -> "Settings":
        if self.app_env.lower() != "production":
            return self

        if len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must contain at least 32 characters in production")
        if not self.database_url.startswith(("postgresql://", "postgresql+psycopg://")):
            raise ValueError("production DATABASE_URL must use PostgreSQL")
        if self.public_site_url.rstrip("/") != "https://aioncrypto.cloud":
            raise ValueError("PUBLIC_SITE_URL must match the official canonical domain")

        frontend = urlparse(self.frontend_url)
        if frontend.scheme != "https" or frontend.hostname in {"localhost", "127.0.0.1", None}:
            raise ValueError("FRONTEND_URL must be a public HTTPS URL in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
