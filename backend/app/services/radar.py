"""Free RSS/Atom discovery with strict network and content limits."""
from __future__ import annotations

import ipaddress
import socket
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Article, Source
from app.pipeline.editorial import EditorialPipeline, valid_public_url

MAX_FEED_BYTES = 2_000_000
MAX_ITEMS = 25


def _public_host(url: str) -> bool:
    if not valid_public_url(url):
        return False
    host = urlparse(url).hostname or ""
    try:
        addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    except OSError:
        return False
    return bool(addresses) and all(ipaddress.ip_address(item[4][0]).is_global for item in addresses)


def _text(node: ET.Element, names: tuple[str, ...]) -> str:
    for child in node.iter():
        tag = child.tag.rsplit("}", 1)[-1].lower()
        if tag in names and child.text:
            return " ".join(child.text.split())
    return ""


def _published_at(node: ET.Element) -> datetime | None:
    value = _text(node, ("pubdate", "published", "updated"))
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def scan_source(db: Session, source_id: int) -> dict:
    source = db.get(Source, source_id)
    if source is None or not source.active:
        return {"detected": 0, "status": "inactive"}
    source.last_checked_at = datetime.now(timezone.utc)
    if not _public_host(source.url):
        source.last_error = "source URL does not resolve to a public HTTPS host"
        db.commit()
        raise ValueError(source.last_error)
    try:
        with httpx.Client(timeout=get_settings().http_timeout_seconds, follow_redirects=False, headers={"User-Agent": "AIONCryptoRadar/1.0 (+https://aioncrypto.cloud/sources-methodology)"}) as client:
            response = client.get(source.url)
            response.raise_for_status()
            if len(response.content) > MAX_FEED_BYTES:
                raise ValueError("feed exceeds size limit")
        root = ET.fromstring(response.content)
        nodes = [node for node in root.iter() if node.tag.rsplit("}", 1)[-1].lower() in {"item", "entry"}][:MAX_ITEMS]
        article_ids: list[int] = []
        pipeline = EditorialPipeline(db)
        for node in nodes:
            title = _text(node, ("title",))
            summary = _text(node, ("description", "summary"))[:2000]
            link = _text(node, ("link",))
            if not link:
                for child in node.iter():
                    if child.tag.rsplit("}", 1)[-1].lower() == "link" and child.attrib.get("href"):
                        link = child.attrib["href"]
                        break
            if len(title) < 12 or not valid_public_url(link):
                continue
            before = db.query(Article).count()
            article = pipeline.create_detected(
                title=title,
                summary=summary,
                body="",
                category="Market Analysis",
                priority="normal",
                source_urls=[link],
                source_name=source.name,
                source_published_at=_published_at(node),
            )
            after = db.query(Article).count()
            if after > before:
                article_ids.append(article.id)
        source.last_success_at = datetime.now(timezone.utc)
        source.last_error = ""
        db.commit()
        return {"detected": len(article_ids), "article_ids": article_ids, "items": len(nodes), "status": "ok"}
    except Exception as exc:
        source.last_error = str(exc)[:1000]
        db.commit()
        raise
