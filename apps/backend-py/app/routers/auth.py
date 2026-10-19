"""Регистрация, вход, выход и текущий пользователь — Задание 1, п. 1–2."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import shared_generated as kim
from ..config import AUTH_COOKIE_NAME, COOKIE_SECURE, SESSION_MAX_AGE_SECONDS
from ..database import User
from ..deps import current_user, get_db, throttle_auth
from ..errors import field_error
from ..schemas import LoginRequest, RegisterRequest
from ..security import hash_password, issue_token, verify_password
from ..serializers import user_dto

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Хеш несуществующего пользователя: пароль проверяется всегда, чтобы по времени
# ответа нельзя было отличить «нет такого логина» от «неверный пароль».
_DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AA=="


def _set_session_cookie(response: Response, user: User) -> None:
    response.set_cookie(
        AUTH_COOKIE_NAME,
        issue_token(user.id),
        httponly=True,
        samesite="lax",
        # secure только за HTTPS: на площадке ДЭ приложение работает по http.
        secure=COOKIE_SECURE,
        path="/",
        max_age=SESSION_MAX_AGE_SECONDS,
    )


@router.post("/register", status_code=201, dependencies=[Depends(throttle_auth)])
def register(body: RegisterRequest, response: Response, db: Session = Depends(get_db)) -> dict:
    taken = db.scalar(select(User).where(User.login == body.login))

    if taken is not None:
        raise field_error(409, "login", kim.MESSAGES["loginTaken"])

    user = User(
        login=body.login,
        password_hash=hash_password(body.password),
        full_name=body.fullName.strip(),
        phone=body.phone,
        email=body.email,
        # Роль не принимается из запроса ни при каких условиях.
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _set_session_cookie(response, user)

    return user_dto(user)


@router.post("/login", dependencies=[Depends(throttle_auth)])
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)) -> dict:
    user = db.scalar(select(User).where(User.login == body.login))
    stored = user.password_hash if user else _DUMMY_HASH
    matches = verify_password(body.password, stored)

    if user is None or not matches:
        raise field_error(401, "login", kim.MESSAGES["credentials"])

    _set_session_cookie(response, user)

    return user_dto(user)


@router.post("/logout", status_code=204)
def logout() -> Response:
    # Удаление ставится на тот же объект ответа, который возвращается: если
    # вернуть новый Response, заголовок Set-Cookie потеряется, и выход
    # «срабатывает» только на вид — сессия остаётся живой.
    response = Response(status_code=204)
    response.delete_cookie(
        AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
    )

    return response


@router.get("/me")
def me(user: User = Depends(current_user)) -> dict:
    return user_dto(user)
