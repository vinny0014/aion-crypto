#!/usr/bin/env python3
"""Create the first admin user interactively. Never hardcodes credentials.

Usage: cd backend && ../scripts/seed_admin.py
"""
import getpass
import sys

sys.path.insert(0, ".")

from app.db import get_sessionmaker, init_db  # noqa: E402
from app.models import User  # noqa: E402
from app.security import hash_password  # noqa: E402


def main() -> None:
    init_db()
    email = input("Admin email: ").strip()
    password = getpass.getpass("Password (min 12 chars): ")
    if len(password) < 12:
        raise SystemExit("Password too short.")
    s = get_sessionmaker()()
    if s.query(User).filter_by(email=email).first():
        raise SystemExit("User already exists.")
    s.add(User(email=email, password_hash=hash_password(password), role="admin"))
    s.commit()
    print(f"Admin '{email}' created.")


if __name__ == "__main__":
    main()
