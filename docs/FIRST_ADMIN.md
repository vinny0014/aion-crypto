# First administrator

This is a manual, one-time operational command. It is not called by Render startup, CI, migrations, or any seed process.

## Preferred production bootstrap: protected GitHub Actions

When the Render Free service has no Shell, use **Actions → Create first administrator → Run workflow**. This workflow has no `push`, `pull_request`, deploy, schedule, or reusable trigger. Configure the GitHub Environment named `production-bootstrap` with required reviewers before running it.

Create only these Environment secrets, never repository variables or workflow inputs:

- `DATABASE_URL` — the existing production connection secret;
- `FIRST_ADMIN_EMAIL` — the intended administrator e-mail;
- `FIRST_ADMIN_PASSWORD` — a new 12–72-byte password with uppercase, lowercase, number, and symbol.

The workflow uses Python 3.12, masks the three values, runs `alembic upgrade head`, and then invokes `python -m app.cli.bootstrap_first_admin`. It calls the exact same `create_first_admin()` service as the interactive CLI, including validation, PostgreSQL advisory locking, the `admin` application role (the model's canonical value for ADMIN), and the bcrypt hash routine used by login. It refuses an existing administrator or duplicate user and logs only generic outcome messages.

Immediately after a successful run:

1. Delete `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` from `production-bootstrap`.
2. Keep `DATABASE_URL` only if that Environment already needs it for this protected operation.
3. Disable or delete `.github/workflows/create-first-admin.yml` in a follow-up commit.
4. Test login and an authenticated watchlist with the administrator account.

No artifacts, caches, credential files, inputs, or logs retain these values. Do not use the workflow a second time; it is intentionally blocked once any administrator exists.

Run it only after Alembic has created the production schema, from a Render Shell (or another controlled shell with the existing production environment variables):

```bash
cd backend
AION_ADMIN_EMAIL='admin@example.com' python -m app.cli.create_admin
```

`AION_ADMIN_EMAIL` is optional; when omitted, the command asks for it. The password is always requested twice through a hidden terminal prompt and is never accepted from an environment variable, command argument, file, or Git. A non-interactive shell is rejected so `getpass` can never fall back to an echoed password prompt.

The command normalizes the e-mail, requires a 12-72-byte password containing uppercase, lowercase, number, and symbol, and uses the same bcrypt implementation as `/api/v1/auth/login`. It creates one active user with role `admin` through SQLAlchemy. A duplicate e-mail fails without changing the existing account, including when concurrent commands race at the database unique index.

Only the generic audit event `administrator_created` is recorded after success. Passwords, hashes, tokens, connection strings, and e-mail values are not printed or logged by the command.

If the command reports that an administrator already exists, stop and verify the intended account through the approved operational process. Do not rerun it to overwrite, reset, or create an additional account.
