"""Shared, one-time first-administrator creation service.

Both the local CLI and the protected GitHub Actions bootstrap call this module.
It contains no credential logging or transport concerns.
"""
from __future__ import annotations

import logging
from collections.abc import Callable

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_sessionmaker
from app.models import User
from app.security import hash_password

audit_logger = logging.getLogger("aion_crypto.audit")
_email_adapter = TypeAdapter(EmailStr)
_minimum_password_length = 12
_maximum_bcrypt_password_bytes = 72
_ADMIN_ROLE = "admin"
_FIRST_ADMIN_LOCK_KEY = 928017654


class AdminCreationError(RuntimeError):
    """A safe, non-secret-bearing failure returned by a bootstrap entrypoint."""


class AdministratorAlreadyExists(AdminCreationError):
    """Raised when an administrator exists or the requested e-mail is in use."""


def normalize_email(raw_email: str) -> str:
    """Validate and canonicalize the login identifier used by the auth router."""
    try:
        return str(_email_adapter.validate_python(raw_email.strip().casefold()))
    except (ValidationError, AttributeError) as exc:
        raise AdminCreationError("Invalid administrator email.") from exc


def validate_password_strength(password: str) -> None:
    """Enforce an explicit baseline before the application bcrypt-hashes it."""
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


def _lock_first_admin_creation(session: Session) -> None:
    """Serialize the one-time check on PostgreSQL without affecting SQLite tests."""
    if session.get_bind().dialect.name == "postgresql":
        session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _FIRST_ADMIN_LOCK_KEY})


def create_first_admin(
    email: str,
    password: str,
    session_factory: Callable[[], Session] | None = None,
) -> User:
    """Persist the only administrator through the same ORM and bcrypt path as login."""
    normalized_email = normalize_email(email)
    validate_password_strength(password)
    factory = session_factory or get_sessionmaker()
    session: Session = factory()
    try:
        _lock_first_admin_creation(session)
        if session.execute(select(User.id).where(User.role == _ADMIN_ROLE).limit(1)).scalar_one_or_none():
            raise AdministratorAlreadyExists("An administrator already exists.")
        if session.execute(select(User.id).where(User.email == normalized_email)).scalar_one_or_none():
            raise AdministratorAlreadyExists("Administrator already exists.")
        administrator = User(
            email=normalized_email,
            password_hash=hash_password(password),
            role=_ADMIN_ROLE,
            is_active=True,
        )
        session.add(administrator)
        session.commit()
        session.refresh(administrator)
    except IntegrityError as exc:
        session.rollback()
        raise AdministratorAlreadyExists("Administrator already exists.") from exc
    except SQLAlchemyError as exc:
        session.rollback()
        audit_logger.error("administrator_creation_failed")
        raise AdminCreationError("Administrator creation failed.") from exc
    finally:
        session.close()

    audit_logger.info("administrator_created")
    return administrator
