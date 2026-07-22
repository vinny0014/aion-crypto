#!/usr/bin/env python3
"""Fail CI when production identity or repository hygiene drifts."""
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OFFICIAL_URL = "https://aioncrypto.cloud"


def fail(message: str) -> None:
    raise SystemExit(message)


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def main() -> None:
    site = read("frontend/lib/site.ts")
    env = read(".env.example")
    package = read("frontend/package.json")

    required = {
        'export const APP_NAME = "AION Crypto";': site,
        'export const APP_SHORT_NAME = "AIONCRYPTO";': site,
        'export const TAGLINE = "Crypto Market Intelligence";': site,
        f'export const PRODUCTION_URL = "{OFFICIAL_URL}";': site,
        "REPOSITORY=vinny0014/aion-crypto": env,
        "NEXT_PUBLIC_ENABLE_INDEXING=false": env,
        '"next": "15.5.21"': package,
    }
    for needle, body in required.items():
        if needle not in body:
            fail(f"missing production contract: {needle}")

    required_frontend_modules = (
        "frontend/lib/fixtures.ts",
        "frontend/lib/format.ts",
        "frontend/lib/api.ts",
        "frontend/components/ui.tsx",
        "frontend/components/charts.tsx",
    )
    for module in required_frontend_modules:
        if not (ROOT / module).is_file():
            fail(f"missing frontend module: {module}")

    active_paths = [ROOT / "frontend/app", ROOT / "frontend/components", ROOT / "frontend/lib", ROOT / "backend/app"]
    forbidden = ("wordbet", "aion-news", "aionnews")
    for directory in active_paths:
        for path in directory.rglob("*"):
            if path.suffix not in {".py", ".ts", ".tsx", ".mjs"}:
                continue
            lowered = path.read_text(encoding="utf-8").lower()
            for term in forbidden:
                if term in lowered:
                    fail(f"forbidden cross-project reference in {path.relative_to(ROOT)}: {term}")

    tracked = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, check=True, capture_output=True, text=True
    ).stdout.splitlines()
    untracked_modules = [module for module in required_frontend_modules if module not in tracked]
    if untracked_modules:
        fail(f"frontend modules are not tracked: {', '.join(untracked_modules)}")

    generated = [
        path for path in tracked
        if path.endswith((".db", ".sqlite", ".sqlite3", ".tsbuildinfo", ".pyc", ".zip"))
        or "/node_modules/" in f"/{path}/"
        or "/.next/" in f"/{path}/"
    ]
    if generated:
        fail(f"generated artifacts are tracked: {', '.join(generated)}")

    print("production configuration and repository hygiene: ok")


if __name__ == "__main__":
    main()
