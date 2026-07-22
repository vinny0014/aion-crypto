import time

from app.cache import LastValidStore, TTLCache


def test_ttl_cache_set_get_expire():
    c = TTLCache()
    c.set("k", {"v": 1}, ttl_seconds=1)
    assert c.get("k") == {"v": 1}
    time.sleep(1.1)
    assert c.get("k") is None


def test_last_valid_store_roundtrip(tmp_path):
    store = LastValidStore(str(tmp_path / "lv.json"))
    store.save("ticker", [{"symbol": "BTC", "price": 66853.21}])
    loaded = store.load("ticker")
    assert loaded is not None
    assert loaded["value"][0]["symbol"] == "BTC"
    assert "saved_at" in loaded


def test_last_valid_store_missing(tmp_path):
    store = LastValidStore(str(tmp_path / "lv.json"))
    assert store.load("nope") is None
