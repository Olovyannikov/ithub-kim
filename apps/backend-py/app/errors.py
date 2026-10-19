"""Единый формат ошибок.

Тот же, что у основного бэкенда: `{ statusCode, message, errors }`. Фронтенд
раскладывает `errors` по полям формы одним и тем же кодом, поэтому отступать
от формата нельзя (ADR-0005, ADR-0011).
"""

from __future__ import annotations

from fastapi import HTTPException

from . import shared_generated as kim


def field_error(status: int, field: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"statusCode": status, "message": message, "errors": {field: message}},
    )


def plain_error(status: int, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"statusCode": status, "message": message})


def unauthorized() -> HTTPException:
    return plain_error(401, kim.MESSAGES["unauthorized"])


def forbidden() -> HTTPException:
    return plain_error(403, kim.MESSAGES["forbidden"])
