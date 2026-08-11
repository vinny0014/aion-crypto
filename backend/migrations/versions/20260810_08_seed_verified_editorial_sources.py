"""Seed a small, idempotent set of public editorial discovery feeds.

The scheduler treats these as discovery inputs only.  A feed record never
authorises copied text or invented reporting; normal editorial gates remain in
force before anything can become public.

Revision ID: 20260810_08
Revises: 20260809_07
"""
from alembic import op


revision = "20260810_08"
down_revision = "20260809_07"
branch_labels = None
depends_on = None


SOURCES = (
    ("CoinDesk RSS", "https://www.coindesk.com/arc/outboundfeeds/rss/", "rss"),
    ("Bitcoin Magazine RSS", "https://bitcoinmagazine.com/.rss/full/", "rss"),
    ("Ethereum Foundation Blog", "https://blog.ethereum.org/feed.xml", "official"),
)


def upgrade() -> None:
    for name, url, kind in SOURCES:
        op.execute(
            "INSERT INTO public.sources (name, url, kind, trusted, active) "
            f"VALUES ({name!r}, {url!r}, {kind!r}, true, true) "
            "ON CONFLICT (url) DO UPDATE SET active = true, trusted = true"
        )


def downgrade() -> None:
    # Keep historic source records and their audit trail.  Disabling a source
    # is a forward operational change, never a destructive rollback.
    pass
