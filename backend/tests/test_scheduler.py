import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/api.db")
    monkeypatch.setenv("LAST_VALID_STORE_PATH", str(tmp_path / "last-valid.json"))
    import app.db as dbmod
    from app.config import get_settings
    get_settings.cache_clear(); dbmod._engine = None; dbmod._SessionLocal = None
    from app.main import app
    with TestClient(app) as value:
        yield value
    get_settings.cache_clear(); dbmod._engine = None; dbmod._SessionLocal = None


def test_scheduler_rejects_missing_or_bad_token(client, monkeypatch):
    monkeypatch.setenv("SCHEDULER_ENABLED", "true")
    monkeypatch.setenv("SCHEDULER_TOKEN", "a" * 32)
    from app.config import get_settings
    get_settings.cache_clear()
    assert client.post("/internal/scheduler/run").status_code == 401
    assert client.post("/internal/scheduler/run", headers={"X-Scheduler-Token": "bad"}).status_code == 401


def test_scheduler_runs_once_and_reports_status(client, monkeypatch):
    monkeypatch.setenv("SCHEDULER_ENABLED", "true")
    monkeypatch.setenv("SCHEDULER_TOKEN", "a" * 32)
    from app.config import get_settings
    get_settings.cache_clear()
    async def live_snapshot():
        return [
            {"symbol": symbol, "name": symbol, "price": 100.0 + index,
             "change_24h_pct": float(index - 3), "high_24h": 110.0 + index,
             "low_24h": 90.0 + index, "volume_24h_quote": 1_000_000.0 + index}
            for index, symbol in enumerate(("BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK"))
        ], "binance"
    monkeypatch.setattr("app.services.market_news._fetch_live_snapshot", live_snapshot)
    response = client.post("/internal/scheduler/run", headers={"X-Scheduler-Token": "a" * 32})
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    from app.db import get_sessionmaker
    from app.services.scheduler import scheduler_status
    db = get_sessionmaker()()
    assert scheduler_status(db)["status"] == "active"
    db.close()
    public = client.get("/internal/scheduler/status")
    assert public.status_code == 200
    payload = public.json()
    assert payload["last_result"] == "success"
    assert payload["trigger"] == "scheduled"
    assert "last_error" not in payload
