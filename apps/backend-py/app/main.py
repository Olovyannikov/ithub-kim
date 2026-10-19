"""Запасной бэкенд на Python/MySQL (ADR-0011).

Реализует тот же контракт, что основной бэкенд на NestJS: те же пути, те же
формы ответов, тот же формат ошибок и та же сессия. Фронтенд переключается
между ними заменой адреса в прокси, без единой правки в коде клиента.

  pnpm py:dev
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import shared_generated as kim
from .config import WEB_ORIGIN
from .database import Room, SessionLocal, create_schema
from .routers import applications, auth, rooms

app = FastAPI(
    title="Конференции.РФ — API (запасной бэкенд)",
    description=(
        "Реализация контракта из docs/api на Python и MySQL. План отхода на случай, "
        "если на площадке ДЭ не окажется Node.js (ADR-0011)."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[WEB_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(applications.router)


@app.on_event("startup")
def on_startup() -> None:
    # Миграций нет намеренно: это запасной путь, схема создаётся из моделей
    # (ADR-0011).
    create_schema()


@app.exception_handler(RequestValidationError)
def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Ошибки валидации — по полям, как того требует Задание 2, п. 1–2.

    Pydantic отдаёт список ошибок с путями; берём последний сегмент пути как
    имя поля и первое сообщение на поле — на форме показывается одна строка.
    """
    fields: dict[str, str] = {}

    for error in exc.errors():
        location = [part for part in error.get("loc", ()) if part != "body"]
        field = str(location[-1]) if location else "body"

        if field in fields:
            continue

        message = error.get("msg", "")
        # Pydantic предваряет наше сообщение словами «Value error, ».
        fields[field] = message.split("Value error, ", 1)[-1]

    return JSONResponse(
        status_code=400,
        content={
            "statusCode": 400,
            "message": kim.MESSAGES["validationFailed"],
            "errors": fields,
        },
    )


@app.exception_handler(StarletteHTTPException)
def http_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Приводит все ответы с ошибками к единому формату."""
    if isinstance(exc.detail, dict) and "statusCode" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={"statusCode": exc.status_code, "message": str(exc.detail)},
    )


@app.exception_handler(Exception)
def unexpected_handler(_: Request, exc: Exception) -> JSONResponse:
    """Детали внутренней ошибки наружу не отдаём — это подсказка атакующему."""
    import traceback

    traceback.print_exception(type(exc), exc, exc.__traceback__)

    return JSONResponse(
        status_code=500,
        content={"statusCode": 500, "message": kim.MESSAGES["serverError"]},
    )


@app.get("/api/health", tags=["health"])
def health() -> dict:
    """Проверочный эндпоинт: приложение поднялось и база доступна."""
    try:
        with SessionLocal() as db:
            rooms_count = db.query(Room).count()

        return {
            "status": "ok",
            "database": "ok",
            "roomsInDatabase": rooms_count,
            "roomKinds": kim.ROOM_KINDS,
            "applicationStatuses": kim.APPLICATION_STATUSES,
            "backend": "python",
        }
    except Exception:
        return {
            "status": "degraded",
            "database": "unavailable",
            "roomsInDatabase": None,
            "roomKinds": kim.ROOM_KINDS,
            "applicationStatuses": kim.APPLICATION_STATUSES,
            "backend": "python",
        }
