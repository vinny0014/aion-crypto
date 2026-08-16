"""GitHub Actions-only entrypoint for the protected first-admin workflow."""
from __future__ import annotations

import os

from app.services.first_admin import AdminCreationError, AdministratorAlreadyExists, create_first_admin


def main() -> int:
    # The workflow supplies these only as masked GitHub Environment secrets.
    # Never accept credentials via arguments or print their values.
    email = os.environ.get("FIRST_ADMIN_EMAIL")
    password = os.environ.get("FIRST_ADMIN_PASSWORD")
    if not email or not password:
        print("Administrator was not created: required bootstrap credentials are unavailable.")
        return 2
    try:
        create_first_admin(email, password)
    except AdministratorAlreadyExists:
        print("Administrator was not created: bootstrap is already complete.")
        return 1
    except AdminCreationError:
        print("Administrator was not created: bootstrap validation failed.")
        return 2

    print("Administrator created successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
