"""Наполнение базы запасного бэкенда.

Те же данные, что у основного: справочник помещений, администратор из ТЗ и
демонстрационные пользователи с заявками.

  pnpm py:seed
"""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select

from . import shared_generated as kim
from .database import Application, Review, Room, SessionLocal, User, create_schema
from .security import hash_password

ROOMS = [
    ("Аудитория «Ломоносов»", "Аудитория", 120, "Поточная аудитория с амфитеатром, проектором и микрофонной системой.", "lomonosov"),
    ("Аудитория «Вернадский»", "Аудитория", 60, "Аудитория для секционных заседаний, доска и панель для презентаций.", "vernadsky"),
    ("Аудитория «Менделеев»", "Аудитория", 30, "Небольшая аудитория для круглых столов и мастер-классов.", "mendeleev"),
    ("Коворкинг «Открытое пространство»", "Коворкинг", 80, "Открытая зона с трансформируемой мебелью для воркшопов и нетворкинга.", "open-space"),
    ("Коворкинг «Мансарда»", "Коворкинг", 40, "Светлое пространство с панорамными окнами и зоной для кофе-брейка.", "mansarda"),
    ("Коворкинг «Переговорная №7»", "Коворкинг", 16, "Переговорная комната с видеоконференцсвязью для рабочих групп.", "meeting-7"),
    ("Кинозал «Премьера»", "Кинозал", 200, "Большой зал с экраном 12 метров и звуком 7.1 для пленарных заседаний.", "premiera"),
    ("Кинозал «Хроника»", "Кинозал", 90, "Зал для показов и презентаций с наклонным партером.", "hronika"),
    ("Кинозал «Камера»", "Кинозал", 45, "Компактный зал для просмотров и обсуждений в малых группах.", "kamera"),
]

# Учётные данные администратора заданы КИМ: Задание 1, п. 5.
# Пароль `Demo77` короче наших восьми символов — поэтому администратор
# создаётся здесь напрямую, минуя проверку формы регистрации (ADR-0004).
ADMIN = (kim.ADMIN_LOGIN, "Demo77", "Администратор Портала Конференций", "8(495)000-00-00", "admin@conferences.rf", "admin")

USERS = [
    ("petrova01", "DemoPass123", "Петрова Анна Сергеевна", "8(921)555-11-22", "petrova@example.ru", "user"),
    ("sidorov02", "DemoPass123", "Сидоров Дмитрий Олегович", "8(916)777-33-44", "sidorov@example.ru", "user"),
]

APPLICATIONS = [
    ("petrova01", "Кинозал «Премьера»", 21, "Переводом по системе СБП", "Новая", None),
    ("petrova01", "Коворкинг «Мансарда»", 10, "При очном посещении", "Мероприятие назначено", None),
    ("sidorov02", "Аудитория «Ломоносов»", -14, "Переводом по системе СБП", "Завершено",
     (5, "Конференция прошла на высоком уровне: звук и проектор работали без нареканий.")),
    ("sidorov02", "Аудитория «Менделеев»", -30, "При очном посещении", "Завершено", None),
]


def main() -> None:
    create_schema()

    with SessionLocal() as db:
        created_rooms = updated_rooms = 0

        for name, kind, capacity, description, image in ROOMS:
            room = db.scalar(select(Room).where(Room.name == name))

            if room is None:
                db.add(Room(name=name, kind=kind, capacity=capacity, description=description, image_url=image))
                created_rooms += 1
            elif room.image_url != image or room.description != description:
                room.image_url, room.description, room.capacity = image, description, capacity
                updated_rooms += 1

        db.commit()

        created_users = 0

        for login, password, full_name, phone, email, role in [ADMIN, *USERS]:
            if db.scalar(select(User).where(User.login == login)):
                continue

            db.add(User(login=login, password_hash=hash_password(password), full_name=full_name,
                        phone=phone, email=email, role=role))
            created_users += 1

        db.commit()

        created_applications = 0

        for login, room_name, days, payment, status, review in APPLICATIONS:
            user = db.scalar(select(User).where(User.login == login))
            room = db.scalar(select(Room).where(Room.name == room_name))

            if user is None or room is None:
                continue

            exists = db.scalar(
                select(Application).where(Application.user_id == user.id, Application.room_id == room.id)
            )

            if exists:
                continue

            starts_at = (datetime.utcnow() + timedelta(days=days)).replace(hour=10, minute=0, second=0, microsecond=0)
            application = Application(user_id=user.id, room_id=room.id, starts_at=starts_at,
                                      payment_method=payment, status=status)
            db.add(application)
            db.flush()
            created_applications += 1

            if review:
                db.add(Review(application_id=application.id, rating=review[0], text=review[1]))

        db.commit()

        print(f"[seed] помещения: +{created_rooms}, обновлено {updated_rooms}, всего {db.query(Room).count()}")
        print(f"[seed] пользователи: +{created_users}, всего {db.query(User).count()}")
        print(f"[seed] заявки: +{created_applications}, всего {db.query(Application).count()}")
        print(f"[seed] администратор: {ADMIN[0]} / {ADMIN[1]} (задан КИМ)")


if __name__ == "__main__":
    main()
