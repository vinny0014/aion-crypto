import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/api.db")
    monkeypatch.setenv("LAST_VALID_STORE_PATH", str(tmp_path / "lv.json"))
    # reset singletons
    import app.db as dbmod
    from app.config import get_settings
    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None

    from app.main import app
    with TestClient(app) as c:
        yield c
    get_settings.cache_clear()
    dbmod._engine = None
    dbmod._SessionLocal = None


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert client.get("/health/live").status_code == 200
    ready = client.get("/health/ready")
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"


def test_login_flow_and_role_protection(client):
    # seed a user directly
    from app.db import get_sessionmaker
    from app.models import User
    from app.security import hash_password

    s = get_sessionmaker()()
    s.add(User(email="admin@example.com", password_hash=hash_password("s3cret!pass"), role="admin"))
    s.commit(); s.close()

    bad = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "wrong"})
    assert bad.status_code == 401

    ok = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "s3cret!pass"})
    assert ok.status_code == 200
    tokens = ok.json()

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.status_code == 200
    assert me.json()["role"] == "admin"

    cost = client.get("/api/v1/cost/summary", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert cost.status_code == 200
    assert cost.json()["band"] == "NORMAL"

    overview = client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert overview.status_code == 200
    assert overview.json()["agents"]["status"] == "not_connected"

    anon = client.get("/api/v1/cost/summary")
    assert anon.status_code == 401

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refreshed.status_code == 200


def test_registry_endpoint(client):
    r = client.get("/api/v1/market/registry")
    assert r.status_code == 200
    symbols = [c["symbol"] for c in r.json()["data"]]
    assert "BTC" in symbols and "ETH" in symbols
