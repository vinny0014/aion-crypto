"""Point editorial discovery at the canonical, non-redirecting feed URLs.

Revision ID: 20260812_09
Revises: 20260810_08

The radar intentionally does not follow redirects: a redirect chain can bypass
the public-HTTPS origin check used to protect the collector.  The original
seed URLs began returning 301/308 responses, so each scan failed before XML
parsing.  These are the providers' canonical HTTPS feed endpoints as verified
on 2026-08-12.  Existing source rows keep their history and are updated in
place rather than duplicated.
"""
import sqlalchemy as sa
from alembic import op


revision = "20260812_09"
down_revision = "20260810_08"
branch_labels = None
depends_on = None


URL_UPDATES = (
    ("CoinDesk RSS", "https://www.coindesk.com/arc/outboundfeeds/rss/", "https://www.coindesk.com/arc/outboundfeeds/rss", "rss"),
    ("Bitcoin Magazine RSS", "https://bitcoinmagazine.com/.rss/full/", "https://bitcoinmagazine.com/feed", "rss"),
    ("Ethereum Foundation Blog", "https://blog.ethereum.org/feed.xml", "https://blog.ethereum.org/en/feed.xml", "official"),
)


def upgrade() -> None:
    bind = op.get_bind()
    for name, old_url, canonical_url, kind in URL_UPDATES:
        bind.execute(
            sa.text(
                "UPDATE public.sources "
                "SET name = :name, url = :canonical_url, kind = :kind, "
                "trusted = true, active = true "
                "WHERE url = :old_url"
            ),
            {
                "name": name,
                "old_url": old_url,
                "canonical_url": canonical_url,
                "kind": kind,
            },
        )


def downgrade() -> None:
    # Preserve successful-scan history. Source endpoint changes are forward-only
    # operational corrections, not a reason to reactivate known redirect URLs.
    pass
