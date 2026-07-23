"""Regression tests for the manually invoked first-administrator CLI."""
from __future__ import annotations

import logging
from pathlib import Path

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.cli.create_admin import (
    AdminCreationError,
    AdministratorAlreadyExists,
    _read_password,
    create_admin,
)
from app.cli.bootstrap_first_admin import main as bootstrap_main
from app.db import Base
from app.models import User
from app.security import verify_password


@pytest.fixture
def session_factory(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path}/admin-cli.db")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)
    yield factory
    engine.dispose()


def test_cli_creates_normalized_admin_with_login_compatible_hash(session_factory, caplog):
    password = "Correct-Horse-7!"
    with caplog.at_level(logging.INFO, logger="aion_crypto.audit"):
        admin = create_admin("  ADMIN@Example.COM  ", password, session_factory)

    session = session_factory()
    stored = session.execute(select(User).where(User.id == admin.id)).scalar_one()
    session.close()
    assert stored.email == "admin@example.com"
    assert stored.role == "admin"
    assert stored.is_active is True
    assert stored.password_hash != password
    assert verify_password(password, stored.password_hash)
    assert "administrator_created" in caplog.text
    assert password not in caplog.text
    assert stored.password_hash not in caplog.text


@pytest.mark.parametrize("password", ["short1!A", "alllowercase1!", "ALLUPPERCASE1!", "NoNumberHere!", "NoSymbolHere1"])
def test_cli_rejects_weak_passwords(session_factory, password):
    with pytest.raises(AdminCreationError):
        create_admin("admin@example.com", password, session_factory)


def test_cli_rejects_duplicate_administrator(session_factory):
    create_admin("admin@example.com", "Correct-Horse-7!", session_factory)
    with pytest.raises(AdministratorAlreadyExists):
        create_admin("ADMIN@example.com", "Another-Password-8!", session_factory)


def test_cli_refuses_a_second_administrator_with_a_different_email(session_factory):
    create_admin("first@example.com", "Correct-Horse-7!", session_factory)
    with pytest.raises(AdministratorAlreadyExists):
        create_admin("second@example.com", "Another-Password-8!", session_factory)


@pytest.mark.parametrize("email", ["not-an-email", "", "admin@"])
def test_cli_rejects_invalid_email(session_factory, email):
    with pytest.raises(AdminCreationError):
        create_admin(email, "Correct-Horse-7!", session_factory)


def test_cli_refuses_non_interactive_password_prompt(monkeypatch):
    class NonInteractiveInput:
        @staticmethod
        def isatty() -> bool:
            return False

    monkeypatch.setattr("app.cli.create_admin.sys.stdin", NonInteractiveInput())
    with pytest.raises(AdminCreationError, match="secure interactive terminal"):
        _read_password("Administrator password: ")


def test_workflow_entrypoint_never_logs_credentials(monkeypatch, capsys):
    monkeypatch.delenv("FIRST_ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("FIRST_ADMIN_PASSWORD", raising=False)
    assert bootstrap_main() == 2
    output = capsys.readouterr().out
    assert "FIRST_ADMIN" not in output
    assert "password" not in output.lower()


def test_first_admin_workflow_is_manual_only_and_uses_protected_environment():
    workflow = (Path(__file__).parents[2] / ".github/workflows/create-first-admin.yml").read_text()
    assert "workflow_dispatch:" in workflow
    assert "push:" not in workflow
    assert "pull_request:" not in workflow
    assert "environment: production-bootstrap" in workflow
    assert "FIRST_ADMIN_PASSWORD" in workflow
    assert "python -m app.cli.bootstrap_first_admin" in workflow
