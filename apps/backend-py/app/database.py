"""Подключение к MySQL и модели данных.

Схема повторяет ER-диаграмму из `docs/er` — ту же, что у основного бэкенда.
Миграций нет намеренно: это запасной путь, таблицы создаются из моделей при
старте (ADR-0011).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    create_engine,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from . import shared_generated as kim
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def _check_in(column: str, values: list[str]) -> str:
    """Ограничение по списку допустимых значений — как `CHECK` у основного бэкенда."""
    items = ", ".join("'" + value.replace("'", "''") + "'" for value in values)

    return f"`{column}` IN ({items})"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint(_check_in("role", kim.USER_ROLES), name="users_role_check"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Уникален только логин: ТЗ не требует уникальности email (ADR-0003).
    login: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(15), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    applications: Mapped[list["Application"]] = relationship(back_populates="user")


class Room(Base):
    __tablename__ = "rooms"
    __table_args__ = (CheckConstraint(_check_in("kind", kim.ROOM_KINDS), name="rooms_kind_check"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint(
            _check_in("status", kim.APPLICATION_STATUSES), name="applications_status_check"
        ),
        CheckConstraint(
            _check_in("payment_method", kim.PAYMENT_METHODS),
            name="applications_payment_method_check",
        ),
        # Индекс под фильтр «начало конференции с… по…» — замер в ADR-0009.
        Index("applications_starts_at_idx", "starts_at"),
        Index("applications_status_idx", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=kim.APPLICATION_STATUS_INITIAL
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="applications")
    room: Mapped[Room] = relationship()
    review: Mapped["Review | None"] = relationship(back_populates="application", uselist=False)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint(
            f"`rating` BETWEEN {kim.RATING_MIN} AND {kim.RATING_MAX}", name="reviews_rating_check"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Один отзыв на одно мероприятие.
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    application: Mapped[Application] = relationship(back_populates="review")


def create_schema() -> None:
    Base.metadata.create_all(engine)
