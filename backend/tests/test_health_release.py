from app.routers.health import _release_metadata


def test_release_metadata_prefers_explicit_aion_sha(monkeypatch):
    monkeypatch.setenv("AION_RELEASE_SHA", "ABCDEF1234567890")
    monkeypatch.setenv("RENDER_GIT_COMMIT", "1111111111111111111111111111111111111111")

    release = _release_metadata()

    assert release == {
        "release_sha": "abcdef1234567890",
        "release_short_sha": "abcdef123456",
        "release_source": "AION_RELEASE_SHA",
    }


def test_release_metadata_accepts_render_commit(monkeypatch):
    monkeypatch.delenv("AION_RELEASE_SHA", raising=False)
    monkeypatch.setenv("RENDER_GIT_COMMIT", "0123456789abcdef0123456789abcdef01234567")

    release = _release_metadata()

    assert release["release_sha"] == "0123456789abcdef0123456789abcdef01234567"
    assert release["release_short_sha"] == "0123456789ab"
    assert release["release_source"] == "RENDER_GIT_COMMIT"


def test_release_metadata_never_exposes_arbitrary_environment_values(monkeypatch):
    for key in ("AION_RELEASE_SHA", "RENDER_GIT_COMMIT", "GITHUB_SHA", "SOURCE_VERSION"):
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv("AION_RELEASE_SHA", "not-a-sha-or-secret")

    assert _release_metadata() == {
        "release_sha": None,
        "release_short_sha": None,
        "release_source": None,
    }
