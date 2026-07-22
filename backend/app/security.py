"""Auth primitives: bcrypt password hashing + JWT access/refresh tokens."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import get_settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def _create_token(subject: str, role: str, token_type: str, expires_delta: timedelta) -> str:
    s = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, s.jwt_secret, algorithm=s.jwt_algorithm)


def create_access_token(subject: str, role: str) -> str:
    s = get_settings()
    return _create_token(subject, role, "access", timedelta(minutes=s.access_token_expire_minutes))


def create_refresh_token(subject: str, role: str) -> str:
    s = get_settings()
    return _create_token(subject, role, "refresh", timedelta(days=s.refresh_token_expire_days))


def decode_token(token: str) -> dict:
    s = get_settings()
    return jwt.decode(token, s.jwt_secret, algorithms=[s.jwt_algorithm])
