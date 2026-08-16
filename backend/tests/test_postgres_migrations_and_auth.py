"""Integration regression: migrations must create the auth schema in PostgreSQL."""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient


POSTGRES_URL = os.getenv("POSTGRES_INTEGRATION_DATABASE_URL")
pytestmark = pytest.mark.skipif(not POSTGRES_URL, reason="requires CI PostgreSQL service")


def test_migrated_postgres_auth_flow(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", POSTGRES_URL)
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET", "postgres-integration-secret-with-more-than-thirty-two-characters")
    monkeypatch.setenv("FRONTEND_URL", "https://preview.example.test")
    monkeypatch.setenv("PUBLIC_SITE_URL", "https://aioncrypto.cloud")

    import app.db as dbmod
    from app.config import get_settings
    from app.db import get_sessionmaker
    from app.models import User
    from app.security import hash_password

    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None
    session = get_sessionmaker()()
    session.add(User(email="postgres-admin@example.com", password_hash=hash_password("s3cret!pass"), role="admin"))
    session.commit()
    session.close()

    from app.main import app
    with TestClient(app) as client:
        invalid_payload = client.post("/api/v1/auth/login", json={"email": "bad"})
        assert invalid_payload.status_code == 422
        unknown = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
        assert unknown.status_code == 401
        bad_password = client.post("/api/v1/auth/login", json={"email": "postgres-admin@example.com", "password": "wrong"})
        assert bad_password.status_code == 401

        login = client.post("/api/v1/auth/login", json={"email": "postgres-admin@example.com", "password": "s3cret!pass"})
        assert login.status_code == 200
        tokens = login.json()
        me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
        assert me.status_code == 200
        assert me.json()["role"] == "admin"
        refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert refreshed.status_code == 200

    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None
