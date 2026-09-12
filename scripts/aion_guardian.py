#!/usr/bin/env python3
"""Lightweight 24x7 production guard for AION Crypto.

The guard deliberately checks only public, non-mutating surfaces.  It is safe to
run frequently from GitHub Actions and produces a machine-readable JSON report
for the control plane.  Browser-heavy checks (CLS, console, consent UI) stay in
the dedicated production Playwright preflight.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

SITE = "https://aioncrypto.cloud"
BACKEND = "https://aion-crypto-api.onrender.com"
UA = "AION-Guardian/1.0 (+https://aioncrypto.cloud)"
EXPECTED_ADS = "google.com, pub-3354845222558845, DIRECT, f08c47fec0942fa0\n"
PILLARS = {
    "/explained/bitcoin": "What Is Bitcoin?",
    "/explained/ethereum": "What Is Ethereum?",
    "/explained/xrp": "What Is XRP?",
    "/explained/solana": "What Is Solana?",
    "/explained/bnb": "What Is BNB?",
    "/explained/cardano": "What Is Cardano?",
}
TRUST_PAGES = (
    "/privacy",
    "/cookie-policy",
    "/terms",
    "/disclaimer",
    "/about",
    "/contact",
    "/editorial-policy",
    "/corrections-policy",
    "/copyright-dmca",
)


@dataclass
class Check:
    name: str
    ok: bool
    severity: str
    detail: str
    elapsed_ms: int | None = None


class Response:
    def __init__(self, status: int, body: bytes, headers: dict[str, str], elapsed_ms: int):
        self.status = status
        self.body = body
        self.headers = headers
        self.elapsed_ms = elapsed_ms

    @property
    def text(self) -> str:
        return self.body.decode("utf-8", errors="replace")

    def json(self) -> Any:
        return json.loads(self.text)


def fetch(url: str, timeout: float = 15.0) -> Response:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/json,text/plain;q=0.9,*/*;q=0.8",
            "Cache-Control": "no-cache",
        },
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(2_000_000)
            elapsed_ms = round((time.perf_counter() - started) * 1000)
            headers = {key.lower(): value for key, value in response.headers.items()}
            return Response(response.status, body, headers, elapsed_ms)
    except urllib.error.HTTPError as error:
        body = error.read(2_000_000)
        elapsed_ms = round((time.perf_counter() - started) * 1000)
        headers = {key.lower(): value for key, value in error.headers.items()}
        return Response(error.code, body, headers, elapsed_ms)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", default="guardian-report.json", help="JSON report path")
    args = parser.parse_args()

    checks: list[Check] = []

    def add(name: str, ok: bool, detail: str, *, severity: str = "critical", elapsed_ms: int | None = None) -> None:
        checks.append(Check(name=name, ok=ok, severity=severity, detail=detail[:1200], elapsed_ms=elapsed_ms))

    def safe_fetch(name: str, url: str) -> Response | None:
        try:
            return fetch(url)
        except Exception as exc:  # network/TLS/DNS timeout etc.
            add(name, False, f"request failed: {type(exc).__name__}: {exc}")
            return None

    home = safe_fetch("home_http", f"{SITE}/")
    if home is not None:
        text = home.text
        add("home_http", home.status == 200, f"HTTP {home.status}", elapsed_ms=home.elapsed_ms)
        add("home_render_signature", "Application error" not in text and "AION Crypto" in text, "AION identity present and no Application error")
        canonical_ok = bool(re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']https://aioncrypto\.cloud/?["\']', text, re.I))
        add("home_canonical", canonical_ok, "canonical points at aioncrypto.cloud")
        csp = home.headers.get("content-security-policy", "")
        add("home_csp", "default-src 'self'" in csp, "CSP default-src self present", severity="warning")
        if home.elapsed_ms > 5000:
            add("home_latency", False, f"slow response {home.elapsed_ms}ms", severity="warning", elapsed_ms=home.elapsed_ms)
        else:
            add("home_latency", True, f"{home.elapsed_ms}ms", severity="warning", elapsed_ms=home.elapsed_ms)

    for path, expected_heading in PILLARS.items():
        response = safe_fetch(f"pillar:{path}", f"{SITE}{path}")
        if response is None:
            continue
        body = response.text
        ok = response.status == 200 and expected_heading in body and "Application error" not in body
        add(f"pillar:{path}", ok, f"HTTP {response.status}; expected heading={expected_heading!r}", elapsed_ms=response.elapsed_ms)
        cache_control = response.headers.get("cache-control", "").lower()
        add(
            f"pillar_cache:{path}",
            "no-cache" in cache_control or "no-store" in cache_control,
            f"cache-control={cache_control or '<missing>'}",
        )

    for path in TRUST_PAGES:
        response = safe_fetch(f"trust:{path}", f"{SITE}{path}")
        if response is not None:
            add(f"trust:{path}", response.status == 200, f"HTTP {response.status}", elapsed_ms=response.elapsed_ms)

    ads = safe_fetch("ads_txt", f"{SITE}/ads.txt")
    if ads is not None:
        add(
            "ads_txt",
            ads.status == 200 and ads.text == EXPECTED_ADS,
            f"HTTP {ads.status}; exact publisher record={'yes' if ads.text == EXPECTED_ADS else 'no'}",
            elapsed_ms=ads.elapsed_ms,
        )

    robots = safe_fetch("robots_txt", f"{SITE}/robots.txt")
    if robots is not None:
        blanket_block = bool(re.search(r"(?mi)^\s*disallow:\s*/\s*$", robots.text))
        add("robots_txt", robots.status == 200 and not blanket_block, f"HTTP {robots.status}; blanket_block={blanket_block}")

    sitemap = safe_fetch("sitemap", f"{SITE}/sitemap.xml")
    if sitemap is not None:
        missing = [path for path in PILLARS if f"{SITE}{path}" not in sitemap.text]
        add("sitemap", sitemap.status == 200 and not missing, f"HTTP {sitemap.status}; missing_pillars={missing}")

    ready = safe_fetch("backend_ready", f"{BACKEND}/health/ready")
    if ready is not None:
        payload: dict[str, Any] = {}
        try:
            payload = ready.json()
        except Exception as exc:
            add("backend_ready_json", False, f"invalid JSON: {exc}")
        else:
            add(
                "backend_ready",
                ready.status == 200 and payload.get("status") == "ready" and payload.get("database") == "ok",
                f"HTTP {ready.status}; status={payload.get('status')}; database={payload.get('database')}",
                elapsed_ms=ready.elapsed_ms,
            )
            add(
                "coordination_dispatch_retry",
                payload.get("coordination_dispatch_retry") is True,
                f"coordination_dispatch_retry={payload.get('coordination_dispatch_retry')!r}",
            )
            release = payload.get("release_sha")
            release_ok = isinstance(release, str) and bool(re.fullmatch(r"[0-9a-f]{7,40}", release.lower()))
            add(
                "backend_release_fingerprint",
                release_ok,
                f"release_sha={release!r}; source={payload.get('release_source')!r}",
                severity="warning",
            )

    build_info = safe_fetch("frontend_build_info", f"{SITE}/build-info.json")
    if build_info is not None:
        if build_info.status == 404:
            add("frontend_build_info", False, "build fingerprint not deployed yet", severity="warning", elapsed_ms=build_info.elapsed_ms)
        else:
            try:
                build = build_info.json()
                sha = build.get("sha") if isinstance(build, dict) else None
                ok = build_info.status == 200 and isinstance(sha, str) and bool(re.fullmatch(r"[0-9a-f]{7,40}", sha.lower()))
                add("frontend_build_info", ok, f"HTTP {build_info.status}; sha={sha!r}", severity="warning", elapsed_ms=build_info.elapsed_ms)
            except Exception as exc:
                add("frontend_build_info", False, f"invalid JSON: {exc}", severity="warning", elapsed_ms=build_info.elapsed_ms)

    critical_failures = [check for check in checks if not check.ok and check.severity == "critical"]
    warnings = [check for check in checks if not check.ok and check.severity == "warning"]
    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "site": SITE,
        "backend": BACKEND,
        "status": "fail" if critical_failures else "pass",
        "critical_failures": len(critical_failures),
        "warnings": len(warnings),
        "checks": [asdict(check) for check in checks],
    }
    report_path = Path(args.json)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 1 if critical_failures else 0


if __name__ == "__main__":
    sys.exit(main())
