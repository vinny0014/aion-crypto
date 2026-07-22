import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_aion.db")
os.environ.setdefault("LAST_VALID_STORE_PATH", "data/test_last_valid.json")

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def clean_state(tmp_path, monkeypatch):
    # isolate persisted last-valid file per test
    monkeypatch.setenv("LAST_VALID_STORE_PATH", str(tmp_path / "last_valid.json"))
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
