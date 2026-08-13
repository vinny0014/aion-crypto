# AION Codex–Manus coordination rule

The production API is the single source of truth for work shared by Codex and
Manus. Chat messages are notifications, not task state.

## Invariants

1. Every open task has exactly one responsible actor: `codex` or `manus`.
2. Work starts only after a lease is claimed. The default lease is 15 minutes.
3. A working actor renews its lease with a heartbeat before expiry.
4. An expired lease is recovered and assigned to the other actor.
5. A technical obstacle must be handed off. It may not park a task.
6. Only payment, CAPTCHA, login, 2FA or a real business decision may set
   `blocked_external`.
7. Idempotency keys prevent the same mission from being created twice.
8. Task-scoped lease tokens are stored only as SHA-256 hashes and are invalid
   immediately after handoff, completion or an external block.
9. Every transition is appended to the private coordination event ledger.
10. The existing hourly scheduler also runs the watchdog, avoiding an extra
    scheduled GitHub Actions job and its associated usage.

## State flow

`queued → running → completed`

Recovery and exceptions:

- `running → queued(other actor)` when a lease expires or work is handed off.
- `running → blocked_external` only for an allowed external blocker.
- `running → failed` only after the configured lease-recovery limit.

The coordinator never merges code, deploys, publishes content or changes
secrets by itself. It tracks ownership and wakes the next actor; the task's own
authorization still controls what that actor may do.
