"""Настройки запасного бэкенда.

Читаются из того же `.env` в корне репозитория, что и у основного бэкенда:
секрет сессии общий, поэтому токен, выданный одним, принимается другим
(ADR-0011).
"""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def _load_env() -> None:
    """Простейшее чтение .env без внешней зависимости."""
    env_path = ROOT / ".env"

    if not env_path.exists():
        return

    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_env()

DATABASE_URL: str = os.environ.get(
    "MYSQL_URL", "mysql+pymysql://kim:kim@localhost:3306/conferences?charset=utf8mb4"
)

PORT: int = int(os.environ.get("PY_API_PORT", "3001"))
WEB_ORIGIN: str = os.environ.get("WEB_ORIGIN", "http://localhost:5173")
COOKIE_SECURE: bool = os.environ.get("COOKIE_SECURE") == "true"

AUTH_COOKIE_NAME = "conf_session"
SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60


def require_jwt_secret() -> str:
    """Секрет не имеет значения по умолчанию — как и в основном бэкенде.

    Зашитый в код секрет это ровно та находка, которую ищут по критерию
    «подсистемы безопасности». Лучше честно упасть при старте.
    """
    secret = os.environ.get("JWT_SECRET", "")

    if len(secret) < 32:
        raise RuntimeError(
            "Не задан JWT_SECRET (не короче 32 символов). Скопируйте .env.example в .env "
            "и подставьте значение, например: openssl rand -base64 48"
        )

    return secret
