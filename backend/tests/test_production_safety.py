import pytest
from pydantic import ValidationError

from app.circuit_breaker import CircuitBreaker
from app.config import Settings


def test_production_rejects_weak_or_local_configuration():
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            app_env="production",
            jwt_secret="short",
            database_url="sqlite:///unsafe.db",
            frontend_url="http://localhost:3000",
        )


def test_production_accepts_official_https_and_postgres():
    settings = Settings(
        _env_file=None,
        app_env="production",
        jwt_secret="x" * 32,
        database_url="postgresql+psycopg://user:password@example.invalid/aion",
        frontend_url="https://aioncrypto.cloud",
        public_site_url="https://aioncrypto.cloud",
    )
    assert settings.allowed_origins() == ["https://aioncrypto.cloud"]


def test_circuit_breaker_opens_and_resets():
    breaker = CircuitBreaker(failure_threshold=2, recovery_seconds=60)
    assert breaker.allow_request()
    breaker.record_failure()
    assert breaker.allow_request()
    breaker.record_failure()
    assert not breaker.allow_request()
    assert breaker.state == "open"
    breaker.record_success()
    assert breaker.state == "closed"
