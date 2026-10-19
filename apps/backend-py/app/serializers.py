"""Преобразование моделей в формы ответов из контракта `docs/api`."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from . import shared_generated as kim
from .database import Application, Room, User


def iso(value: datetime) -> str:
    """MySQL хранит время без зоны, поэтому помечаем его как UTC явно."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def user_dto(user: User) -> dict[str, Any]:
    """Без хеша пароля и служебных полей."""
    return {
        "id": user.id,
        "login": user.login,
        "fullName": user.full_name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
    }


def room_dto(room: Room) -> dict[str, Any]:
    return {
        "id": room.id,
        "name": room.name,
        "kind": room.kind,
        "capacity": room.capacity,
        "description": room.description,
        "imageUrl": room.image_url,
    }


def application_dto(application: Application, with_author: bool = False) -> dict[str, Any]:
    review = application.review

    dto: dict[str, Any] = {
        "id": application.id,
        "room": room_dto(application.room),
        "startsAt": iso(application.starts_at),
        "paymentMethod": application.payment_method,
        "status": application.status,
        "createdAt": iso(application.created_at),
        "review": (
            {
                "id": review.id,
                "rating": review.rating,
                "text": review.text,
                "createdAt": iso(review.created_at),
            }
            if review
            else None
        ),
        # Право на отзыв считает сервер, клиент только показывает кнопку.
        "canLeaveReview": kim.can_leave_review(application.status) and review is None,
    }

    if with_author and application.user:
        dto["author"] = {
            "id": application.user.id,
            "login": application.user.login,
            "fullName": application.user.full_name,
            "phone": application.user.phone,
            "email": application.user.email,
        }

    return dto
