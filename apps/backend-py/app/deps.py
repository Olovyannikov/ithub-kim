"""Общие зависимости: сессия базы, текущий пользователь, роль, частота запросов."""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Iterator

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from .config import AUTH_COOKIE_NAME
from .database import SessionLocal, User
from .errors import forbidden, plain_error, unauthorized
from .security import read_token
from . import shared_generated as kim


def get_db() -> Iterator[Session]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Пользователь читается из базы по идентификатору из токена.

    Как и в основном бэкенде: в токене только `sub`, роль берётся из базы,
    поэтому смена роли действует сразу (ADR-0004).
    """
    token = request.cookies.get(AUTH_COOKIE_NAME)

    if not token:
        raise unauthorized()

    user_id = read_token(token)

    if user_id is None:
        raise unauthorized()

    user = db.get(User, user_id)

    if user is None:
        raise unauthorized()

    return user


def admin_only(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise forbidden()

    return user


_attempts: dict[str, list[float]] = defaultdict(list)


def throttle_auth(request: Request) -> None:
    """Ограничение частоты входа и регистрации.

    Простое, в памяти процесса — внешнего хранилища на площадке может не быть.
    Пределы те же, что у основного бэкенда, и по той же причине не слишком
    строгие: на защите эксперт может ошибиться паролем несколько раз подряд
    (ADR-0004).
    """
    import os

    limit = int(os.environ.get("AUTH_THROTTLE_LIMIT", "10"))
    window = int(os.environ.get("AUTH_THROTTLE_TTL", "60000")) / 1000
    key = request.client.host if request.client else "unknown"
    now = time.monotonic()

    recent = [stamp for stamp in _attempts[key] if now - stamp < window]
    _attempts[key] = recent

    if len(recent) >= limit:
        raise plain_error(429, kim.MESSAGES["tooManyRequests"])

    _attempts[key].append(now)
