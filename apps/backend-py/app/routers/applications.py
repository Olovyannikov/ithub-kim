"""Заявки, отзывы и панель администратора — Задание 1, п. 3–5."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from .. import shared_generated as kim
from ..database import Application, Review, Room, User
from ..deps import admin_only, current_user, get_db
from ..errors import field_error
from ..schemas import CreateApplicationRequest, CreateReviewRequest, UpdateStatusRequest
from ..serializers import application_dto

router = APIRouter(prefix="/api/applications", tags=["applications"])

PAGE_SIZE_MAX = 100


def _naive_utc(value: datetime) -> datetime:
    """MySQL хранит время без зоны — приводим всё к UTC и снимаем зону."""
    if value.tzinfo is None:
        return value

    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _load(db: Session, application_id: int) -> Application | None:
    """Читает заявку со всеми связями, обновляя то, что уже лежит в сессии.

    `populate_existing` обязателен: без него SQLAlchemy возвращает объект из
    своего кэша, и только что добавленный отзыв в ответе не появляется —
    на странице это выглядит как «отзыв не сохранился».
    """
    return db.scalar(
        select(Application)
        .options(
            joinedload(Application.room), joinedload(Application.review), joinedload(Application.user)
        )
        .where(Application.id == application_id)
        .execution_options(populate_existing=True)
    )


@router.post("", status_code=201)
def create(
    body: CreateApplicationRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict:
    room = db.get(Room, body.roomId)

    if room is None:
        raise field_error(404, "roomId", kim.MESSAGES["roomNotFound"])

    starts_at = _naive_utc(body.startsAt)

    if starts_at < datetime.now(tz=timezone.utc).replace(tzinfo=None):
        raise field_error(400, "startsAt", kim.MESSAGES["startsAtPast"])

    application = Application(
        # Автор берётся из сессии, а не из запроса: подать заявку от чужого
        # имени клиенту нечем.
        user_id=user.id,
        room_id=room.id,
        starts_at=starts_at,
        payment_method=body.paymentMethod,
        status=kim.APPLICATION_STATUS_INITIAL,
    )
    db.add(application)
    db.commit()

    return application_dto(_load(db, application.id))


@router.get("/my")
def find_mine(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[dict]:
    """Отдельный путь, а не фильтр в общем списке: чужие заявки попросить нечем."""
    items = db.scalars(
        select(Application)
        .options(joinedload(Application.room), joinedload(Application.review))
        .where(Application.user_id == user.id)
        .order_by(Application.created_at.desc())
    ).all()

    return [application_dto(item) for item in items]


@router.post("/{application_id}/review", status_code=201)
def add_review(
    application_id: int,
    body: CreateReviewRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict:
    application = _load(db, application_id)

    if application is None:
        raise field_error(404, "id", kim.MESSAGES["applicationNotFound"])

    if application.user_id != user.id:
        raise field_error(403, "id", kim.MESSAGES["forbidden"])

    if not kim.can_leave_review(application.status):
        raise field_error(400, "rating", kim.MESSAGES["reviewNotAllowed"])

    if application.review is not None:
        raise field_error(409, "rating", kim.MESSAGES["reviewAlreadyExists"])

    db.add(Review(application_id=application.id, rating=body.rating, text=body.text))
    db.commit()

    return application_dto(_load(db, application_id))


# --- панель администратора ---


@router.get("")
def find_all(
    status: str | None = Query(default=None),
    roomId: int | None = Query(default=None),
    author: str | None = Query(default=None),
    date_from: str | None = Query(default=None, alias="from"),
    date_to: str | None = Query(default=None, alias="to"),
    limit: int = Query(default=50, ge=1, le=PAGE_SIZE_MAX),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> dict:
    query = (
        select(Application)
        .join(Application.user)
        .options(
            joinedload(Application.room), joinedload(Application.review), joinedload(Application.user)
        )
    )

    if status:
        query = query.where(Application.status == status)

    if roomId:
        query = query.where(Application.room_id == roomId)

    if author:
        pattern = f"%{author}%"
        query = query.where(or_(User.login.like(pattern), User.full_name.like(pattern)))

    if date_from:
        query = query.where(Application.starts_at >= _naive_utc(datetime.fromisoformat(date_from)))

    if date_to:
        query = query.where(Application.starts_at <= _naive_utc(datetime.fromisoformat(date_to)))

    total = len(db.scalars(query).unique().all())
    items = (
        db.scalars(query.order_by(Application.created_at.desc()).limit(limit).offset(offset))
        .unique()
        .all()
    )

    return {"items": [application_dto(item, with_author=True) for item in items], "total": total}


@router.patch("/{application_id}/status")
def update_status(
    application_id: int,
    body: UpdateStatusRequest,
    _: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> dict:
    application = _load(db, application_id)

    if application is None:
        raise field_error(404, "id", kim.MESSAGES["applicationNotFound"])

    application.status = body.status
    db.commit()

    return application_dto(_load(db, application_id))
