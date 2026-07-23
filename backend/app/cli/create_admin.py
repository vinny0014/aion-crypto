"""Create the first AION Crypto administrator without storing credentials."""
from __future__ import annotations

import getpass
import logging
import os
import sys
from collections.abc import Callable

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_sessionmaker
from app.models import User
from app.security import hash_password

audit_logger = logging.getLogger("aion_crypto.audit")
_email_adapter = TypeAdapter(EmailStr)
_minimum_password_length = 12
_maximum_bcrypt_password_bytes = 72


class AdminCreationError(RuntimeError):
    """A safe, non-secret-bearing failure returned by the CLI."""


class AdministratorAlreadyExists(AdminCreationError):
    """Raised when the requested administrator e-mail is already in use."""


def normalize_email(raw_email: str) -> str:
    """Validate and canonicalize the login identifier used by the auth router."""
    try:
        return str(_email_adapter.validate_python(raw_email.strip().casefold()))
    except (ValidationError, AttributeError) as exc:
        raise AdminCreationError("Invalid administrator email.") from exc


def validate_password_strength(password: str) -> None:
    """Enforce a deliberately small, explicit baseline before bcrypt hashes it."""
    if (
        len(password) < _minimum_password_length
        or len(password.encode("utf-8")) > _maximum_bcrypt_password_bytes
        or not any(char.islower() for char in password)
        or not any(char.isupper() for char in password)
        or not any(char.isdigit() for char in password)
        or not any(not char.isalnum() for char in password)
    ):
        raise AdminCreationError(
            "Password must be 12-72 bytes and include uppercase, lowercase, number, and symbol."
        )


def create_admin(
    email: str,
    password: str,
    session_factory: Callable[[], Session] = get_sessionmaker,
) -> User:
    """Persist exactly one administrator through the application's ORM layer."""
    normalized_email = normalize_email(email)
    validate_password_strength(password)
    session = session_factory()
    try:
        if session.execute(select(User.id).where(User.email == normalized_email)).scalar_one_or_none():
            raise AdministratorAlreadyExists("Administrator already exists.")
        administrator = User(
            email=normalized_email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )
        session.add(administrator)
        session.commit()
        session.refresh(administrator)
    except IntegrityError as exc:
        session.rollback()
        # The database unique index remains the concurrency-safe final guard.
        raise AdministratorAlreadyExists("Administrator already exists.") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        audit_logger.error("administrator_creation_failed")
        raise AdminCreationError("Administrator creation failed.") from exc
    finally:
        session.close()

    audit_logger.info("administrator_created")
    return administrator


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
        create_admin(email, password)
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
