"""Схемы запросов и ответов.

Правила полей берутся из `shared_generated.py`, который переносится из
`packages/shared` скриптом `pnpm shared:python`. Регулярных выражений и
текстов ошибок здесь нет — только ссылки на перенесённые значения
(ADR-0005, ADR-0011).
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from . import shared_generated as kim


class RegisterRequest(BaseModel):
    login: str
    password: str
    fullName: str
    phone: str
    email: str

    @field_validator("login")
    @classmethod
    def check_login(cls, value: str) -> str:
        import re

        if not re.fullmatch(kim.LOGIN_PATTERN, value):
            raise ValueError(kim.MESSAGES["login"])

        return value

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        if len(value) < kim.PASSWORD_MIN_LENGTH:
            raise ValueError(kim.MESSAGES["password"])

        return value

    @field_validator("fullName")
    @classmethod
    def check_full_name(cls, value: str) -> str:
        import re

        if not re.fullmatch(kim.FULL_NAME_PATTERN, value):
            raise ValueError(kim.MESSAGES["fullName"])

        return value

    @field_validator("phone")
    @classmethod
    def check_phone(cls, value: str) -> str:
        import re

        if not re.fullmatch(kim.PHONE_PATTERN, value):
            raise ValueError(kim.MESSAGES["phone"])

        return value

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        import re

        if not re.fullmatch(kim.EMAIL_PATTERN, value):
            raise ValueError(kim.MESSAGES["email"])

        return value


class LoginRequest(BaseModel):
    """На входе формат не проверяем — иначе форма подсказывала бы перебирающему."""

    login: str = Field(min_length=1)
    password: str = Field(min_length=1)


class CreateApplicationRequest(BaseModel):
    roomId: int = Field(gt=0)
    startsAt: datetime
    paymentMethod: str

    @field_validator("paymentMethod")
    @classmethod
    def check_payment(cls, value: str) -> str:
        if value not in kim.PAYMENT_METHODS:
            raise ValueError(kim.MESSAGES["paymentMethodRequired"])

        return value


class UpdateStatusRequest(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def check_status(cls, value: str) -> str:
        if value not in kim.APPLICATION_STATUSES_ADMIN_ASSIGNABLE:
            raise ValueError(kim.MESSAGES["statusNotAssignable"])

        return value


class CreateReviewRequest(BaseModel):
    rating: int = Field(ge=kim.RATING_MIN, le=kim.RATING_MAX)
    text: str = Field(min_length=1, max_length=2000)
