# First administrator

This is a manual, one-time operational command. It is not called by Render startup, CI, migrations, or any seed process.

Run it only after Alembic has created the production schema, from a Render Shell (or another controlled shell with the existing production environment variables):

```bash
cd backend
AION_ADMIN_EMAIL='admin@example.com' python -m app.cli.create_admin
```

`AION_ADMIN_EMAIL` is optional; when omitted, the command asks for it. The password is always requested twice through a hidden terminal prompt and is never accepted from an environment variable, command argument, file, or Git. A non-interactive shell is rejected so `getpass` can never fall back to an echoed password prompt.

The command normalizes the e-mail, requires a 12-72-byte password containing uppercase, lowercase, number, and symbol, and uses the same bcrypt implementation as `/api/v1/auth/login`. It creates one active user with role `admin` through SQLAlchemy. A duplicate e-mail fails without changing the existing account, including when concurrent commands race at the database unique index.

Only the generic audit event `administrator_created` is recorded after success. Passwords, hashes, tokens, connection strings, and e-mail values are not printed or logged by the command.

If the command reports that an administrator already exists, stop and verify the intended account through the approved operational process. Do not rerun it to overwrite, reset, or create an additional account.
