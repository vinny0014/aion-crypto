from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models import Source
from app.services import radar


def test_scan_source_accepts_a_direct_https_feed_and_creates_detected_article(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path}/radar.db")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    source = Source(name="Canonical feed", url="https://feeds.example.test/crypto.xml", kind="rss")
    db.add(source)
    db.commit()

    feed = b"""<?xml version="1.0"?><rss><channel><item>
        <title>Bitcoin maintainers publish a detailed security notice</title>
        <description>The official source records the maintenance event.</description>
        <link>https://example.test/notices/bitcoin-security</link>
        <pubDate>Tue, 12 Aug 2026 12:00:00 +0000</pubDate>
    </item></channel></rss>"""

    class Response:
        content = feed

        def raise_for_status(self):
            return None

    class Client:
        def __init__(self, **_kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def get(self, url):
            assert url == source.url
            return Response()

    monkeypatch.setattr(radar, "_public_host", lambda url: url == source.url)
    monkeypatch.setattr(radar.httpx, "Client", Client)

    result = radar.scan_source(db, source.id)
    db.refresh(source)
    assert result == {
        "detected": 1, "article_ids": [1], "items": 1,
        "eligible": 1, "duplicates": 0, "status": "ok",
    }
    assert source.last_error == ""
    assert source.last_success_at is not None
    db.close()


def test_feed_markup_is_removed_and_repeat_scan_counts_duplicate(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path}/radar-clean.db")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    source = Source(name="Clean feed", url="https://feeds.example.test/clean.xml", kind="rss")
    db.add(source)
    db.commit()
    feed = b"""<?xml version="1.0"?><rss><channel><item>
      <title>Ethereum protocol publishes a detailed network update</title>
      <description>&lt;p&gt;A &lt;strong&gt;verified&lt;/strong&gt; network notice.&lt;/p&gt;</description>
      <link>https://example.test/notices/ethereum-update</link>
    </item></channel></rss>"""

    class Response:
        content = feed
        def raise_for_status(self): return None

    class Client:
        def __init__(self, **_kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *_args): return False
        def get(self, _url): return Response()

    monkeypatch.setattr(radar, "_public_host", lambda _url: True)
    monkeypatch.setattr(radar.httpx, "Client", Client)
    first = radar.scan_source(db, source.id)
    second = radar.scan_source(db, source.id)
    article = db.query(radar.Article).one()
    assert article.summary == "A verified network notice."
    assert first["detected"] == 1 and first["duplicates"] == 0
    assert second["detected"] == 0 and second["duplicates"] == 1
    db.close()
