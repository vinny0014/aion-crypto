#!/usr/bin/env python3
"""Fail CI when production identity or repository hygiene drifts."""
from __future__ import annotations

import re
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

    hostinger_critical_aliases = {
        "frontend/app/watchlist/page.tsx": (
            "@/lib/fixtures",
            "@/lib/format",
            "@/components/ui",
        ),
        "frontend/app/crypto/[symbol]/page.tsx": (
            "@/lib/api",
            "@/components/charts",
        ),
    }
    alias_pattern = re.compile(
        r"(?:from\s+|import\s*\(\s*|require\s*\(\s*)[\"']@/([^\"']+)[\"']"
    )
    alias_imports: list[tuple[Path, str]] = []
    frontend_sources = (ROOT / "frontend/app", ROOT / "frontend/components", ROOT / "frontend/lib")
    for directory in frontend_sources:
        for path in directory.rglob("*"):
            if path.suffix not in {".ts", ".tsx", ".js", ".jsx", ".mjs"}:
                continue
            source = path.read_text(encoding="utf-8")
            relative_path = path.relative_to(ROOT).as_posix()
            for forbidden_alias in hostinger_critical_aliases.get(relative_path, ()):
                if forbidden_alias in source:
                    fail(f"Hostinger-critical alias remains in {relative_path}: {forbidden_alias}")
            alias_imports.extend((path, match) for match in alias_pattern.findall(source))

    extensions = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")
    for source_path, alias_target in alias_imports:
        target = ROOT / "frontend" / alias_target
        candidates = [target.with_suffix(extension) for extension in extensions]
        candidates.extend(target / f"index{extension}" for extension in extensions)
        if not any(candidate.is_file() for candidate in candidates):
            fail(
                f"unresolved @/ import in {source_path.relative_to(ROOT)}: "
                f"@/{alias_target}"
            )

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

    print(
        "production configuration, repository hygiene and frontend imports: "
        f"ok ({len(alias_imports)} remaining @/ imports resolved)"
    )


if __name__ == "__main__":
    main()
