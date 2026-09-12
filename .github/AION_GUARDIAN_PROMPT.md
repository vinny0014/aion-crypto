# AION Guardian incident contract

When an automated guard run fails, the remediation agent must treat GitHub issue #35 as the control plane and use this order:

1. Reproduce the public failure from evidence in `guardian-report.json`.
2. Inspect the current production branch and latest CI/deploy evidence.
3. Apply only a safe, minimal, reversible correction when the root cause is deterministic.
4. Run the smallest relevant test suite, then the production preflight when the fix can affect AdSense readiness.
5. Record real branch/PR/SHA/run evidence in #35.
6. Never request a new AdSense review, enable Auto Ads, change billing, DNS, credentials, or policy-sensitive content without explicit user authorization.
7. Escalate as `BLOCKED_HUMAN` only for login/MFA/CAPTCHA, unavailable credentials, destructive/costly changes, or policy/account decisions.

Healthy runs stay silent.
