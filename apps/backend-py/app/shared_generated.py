"""
Правила и тексты из технического задания.

ФАЙЛ СГЕНЕРИРОВАН. Не править руками: источник — packages/shared,
обновляется командой `pnpm shared:python` (ADR-0011).
"""

from typing import Final

# Типы помещений, способы оплаты и статусы заявки — дословно из КИМ.
ROOM_KINDS: Final[list[str]] = [
    "Аудитория",
    "Коворкинг",
    "Кинозал",
]

PAYMENT_METHODS: Final[list[str]] = [
    "При очном посещении",
    "Переводом по системе СБП",
]

APPLICATION_STATUSES: Final[list[str]] = [
    "Новая",
    "Мероприятие назначено",
    "Завершено",
]

APPLICATION_STATUS_INITIAL: Final[str] = "Новая"

APPLICATION_STATUSES_ADMIN_ASSIGNABLE: Final[list[str]] = [
    "Мероприятие назначено",
    "Завершено",
]

USER_ROLES: Final[list[str]] = [
    "user",
    "admin",
]

ADMIN_LOGIN: Final[str] = "Conf2027"

# Правила валидации полей регистрации — Задание 1, п. 1.
LOGIN_PATTERN: Final[str] = "^[A-Za-z0-9]{6,}$"
FULL_NAME_PATTERN: Final[str] = "^[А-Яа-яЁё\\s]+$"
PHONE_PATTERN: Final[str] = "^8\\(\\d{3}\\)\\d{3}-\\d{2}-\\d{2}$"
EMAIL_PATTERN: Final[str] = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
PASSWORD_MIN_LENGTH: Final[int] = 8
LOGIN_MIN_LENGTH: Final[int] = 6
RATING_MIN: Final[int] = 1
RATING_MAX: Final[int] = 5

# Сообщения об ошибках — выводятся на форме.
MESSAGES: Final[dict[str, str]] = {
    "required": "Поле обязательно для заполнения",
    "login": "Логин: латиница и цифры, не менее 6 символов",
    "loginTaken": "Пользователь с таким логином уже существует",
    "password": "Пароль: минимум 8 символов",
    "fullName": "ФИО: только символы кириллицы и пробелы",
    "phone": "Телефон в формате 8(XXX)XXX-XX-XX",
    "email": "Некорректный адрес электронной почты",
    "credentials": "Неверный логин или пароль",
    "unauthorized": "Необходимо войти в систему",
    "forbidden": "Недостаточно прав для этого действия",
    "roomNotFound": "Выбранное помещение не найдено",
    "roomRequired": "Выберите помещение",
    "startsAtRequired": "Укажите дату и время начала конференции",
    "startsAtInvalid": "Некорректная дата начала конференции",
    "startsAtPast": "Дата начала конференции не может быть в прошлом",
    "paymentMethodRequired": "Выберите способ оплаты",
    "statusRequired": "Выберите новый статус заявки",
    "statusNotAssignable": "Этот статус нельзя выставить вручную",
    "applicationNotFound": "Заявка не найдена",
    "reviewNotAllowed": "Отзыв можно оставить только после завершения мероприятия",
    "reviewAlreadyExists": "Отзыв об этом мероприятии уже оставлен",
    "reviewTextRequired": "Напишите текст отзыва",
    "ratingInvalid": "Оценка — целое число от 1 до 5",
    "validationFailed": "Проверьте правильность заполнения полей",
    "unexpectedField": "Недопустимое поле в запросе",
    "tooManyRequests": "Слишком много попыток, попробуйте позже",
    "serverError": "Внутренняя ошибка сервера",
}


def can_leave_review(status: str) -> bool:
    """Отзыв можно оставить только после завершения мероприятия."""
    return status == "Завершено"
