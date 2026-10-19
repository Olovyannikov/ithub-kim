"""Пароли и сессия.

Формат хеша и способ подписи токена совпадают с основным бэкендом (ADR-0004),
поэтому учётные записи и уже выданные сессии работают в обоих (ADR-0011).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import SESSION_MAX_AGE_SECONDS, require_jwt_secret

_N = 16384
_R = 8
_P = 1
_KEY_LENGTH = 64
_SALT_LENGTH = 16


def hash_password(password: str) -> str:
    """Возвращает строку вида `scrypt$N$r$p$соль$хеш`."""
    salt = secrets.token_bytes(_SALT_LENGTH)
    derived = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P, dklen=_KEY_LENGTH, maxmem=64 * 1024 * 1024
    )

    return "$".join(
        [
            "scrypt",
            str(_N),
            str(_R),
            str(_P),
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(derived).decode("ascii"),
        ]
    )


def verify_password(password: str, stored: str) -> bool:
    """Проверяет пароль по хешу, созданному любым из двух бэкендов."""
    parts = stored.split("$")

    if len(parts) != 6 or parts[0] != "scrypt":
        return False

    try:
        n, r, p = int(parts[1]), int(parts[2]), int(parts[3])
        salt = base64.b64decode(parts[4])
        expected = base64.b64decode(parts[5])
    except (ValueError, TypeError):
        return False

    try:
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=n,
            r=r,
            p=p,
            dklen=len(expected),
            maxmem=256 * 1024 * 1024,
        )
    except ValueError:
        return False

    return hmac.compare_digest(actual, expected)


def issue_token(user_id: int) -> str:
    """Тот же HS256 и тот же секрет, что у основного бэкенда."""
    now = datetime.now(tz=timezone.utc)

    return jwt.encode(
        {
            "sub": str(user_id),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=SESSION_MAX_AGE_SECONDS)).timestamp()),
        },
        require_jwt_secret(),
        algorithm="HS256",
    )


def read_token(token: str) -> int | None:
    """Возвращает идентификатор пользователя или None, если токен негоден."""
    try:
        payload = jwt.decode(token, require_jwt_secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

    subject = payload.get("sub")

    try:
        return int(subject)
    except (TypeError, ValueError):
        return None
