"""Справочник помещений для выпадающего списка — Задание 2, п. 4."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import Room, User
from ..deps import current_user, get_db
from ..serializers import room_dto

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("")
def list_rooms(_: User = Depends(current_user), db: Session = Depends(get_db)) -> list[dict]:
    rooms = db.scalars(select(Room).order_by(Room.kind, Room.name)).all()

    return [room_dto(room) for room in rooms]
