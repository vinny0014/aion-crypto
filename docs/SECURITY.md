# Security

Implemented now:
- CORS restricted to the configured frontend origin; methods whitelist.
- Security headers on both apps (nosniff, DENY framing, referrer policy); `/admin` marked noindex.
- Passwords hashed with bcrypt; JWT access (30 min) + refresh (7 d) with type checking; role-based route guard.
- No hardcoded credentials anywhere; admin created interactively via seed script; `.env` git-ignored; CI secret scan + dependency audit.
- SQLAlchemy ORM everywhere (no string-built SQL); Pydantic validation on inputs.

Before production (tracked in WORK_HANDOFF.md):
- Rate limiting on `/auth/login` (brute-force) and public API; CSP header tuned to final asset origins; automated DB backups + restore drill; password recovery flow; audit logging for admin actions.

Report vulnerabilities privately to security@aioncrypto.cloud — never via public issues.
