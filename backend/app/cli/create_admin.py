"""Create the first AION Crypto administrator without storing credentials."""
from __future__ import annotations

import getpass
import os
import sys

from app.services.first_admin import (
    AdminCreationError,
    AdministratorAlreadyExists,
    create_first_admin,
    normalize_email,
    validate_password_strength,
)

# Compatibility alias for callers of the original versioned CLI API.
create_admin = create_first_admin


def _read_email() -> str:
    # Only the non-secret identifier may be supplied through the environment.
    return os.environ.get("AION_ADMIN_EMAIL") or input("Administrator email: ")


def _read_password(prompt: str) -> str:
    # getpass can fall back to visible stdin when no terminal is attached.
    # Refuse that mode instead of risking a password echo in logs or CI output.
    if not sys.stdin.isatty():
        raise AdminCreationError("A secure interactive terminal is required for the password prompt.")
    return getpass.getpass(prompt)


def main() -> int:
    try:
        email = _read_email()
        password = _read_password("Administrator password: ")
        confirmation = _read_password("Confirm administrator password: ")
    except AdminCreationError as exc:
        print(f"Administrator was not created: {exc}")
        return 2
    if password != confirmation:
        print("Administrator was not created: password confirmation does not match.")
        return 2

    try:
        create_first_admin(email, password)
    except AdministratorAlreadyExists:
        print("Administrator was not created: account already exists.")
        return 1
    except AdminCreationError as exc:
        print(f"Administrator was not created: {exc}")
        return 2

    print("Administrator created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
