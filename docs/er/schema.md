# Схема данных «Конференции.РФ»

Источник истины — сущности TypeORM в `apps/backend/src/*/*.entity.ts` и миграции в
`apps/backend/src/database/migrations/`. Обоснование решений по полям — в
[ADR-0003](../adr/0003-orm-and-data-model.md).

```mermaid
erDiagram
    users ||--o{ applications : "подаёт"
    rooms ||--o{ applications : "бронируется"
    applications ||--o| reviews : "отзыв"

    users {
        serial id PK
        varchar_64 login UK "латиница и цифры, не менее 6 символов"
        varchar_255 password_hash
        varchar_255 full_name "кириллица и пробелы"
        varchar_15 phone "8(XXX)XXX-XX-XX"
        varchar_255 email "не уникален — ТЗ этого не требует"
        varchar_16 role "user | admin"
        timestamptz created_at
        timestamptz updated_at
    }

    rooms {
        serial id PK
        varchar_255 name
        varchar_32 kind "Аудитория | Коворкинг | Кинозал"
        int capacity "nullable"
        text description "nullable"
        varchar_512 image_url "nullable"
        timestamptz created_at
    }

    applications {
        serial id PK
        int user_id FK
        int room_id FK
        timestamptz starts_at "желаемое начало конференции"
        varchar_32 payment_method "При очном посещении | Переводом по системе СБП"
        varchar_32 status "Новая | Мероприятие назначено | Завершено"
        timestamptz created_at
        timestamptz updated_at
    }

    reviews {
        serial id PK
        int application_id FK "UNIQUE — один отзыв на мероприятие"
        smallint rating "1..5"
        text text
        timestamptz created_at
    }
```

## Ограничения уровня базы

| Ограничение                         | Что проверяет                                      |
| ----------------------------------- | -------------------------------------------------- |
| `users_login_unique`                | уникальность логина (требование ТЗ)                |
| `users_role_check`                  | `role IN ('user', 'admin')`                        |
| `rooms_kind_check`                  | `kind` — только три типа помещений из ТЗ           |
| `applications_status_check`         | `status` — только три статуса из ТЗ                |
| `applications_payment_method_check` | `payment_method` — только два способа оплаты из ТЗ |
| `reviews_rating_check`              | `rating BETWEEN 1 AND 5`                           |
| `reviews.application_id` UNIQUE     | один отзыв на одну заявку                          |

Значения во всех `CHECK` генерируются из констант `@kim/shared`, поэтому база и код не
могут разойтись.

## Поведение при удалении

- Удаление пользователя → его заявки удаляются (`ON DELETE CASCADE`).
- Удаление заявки → её отзыв удаляется (`ON DELETE CASCADE`).
- Удаление помещения запрещено, пока на него есть заявки (`ON DELETE RESTRICT`).

## Индексы

`applications.user_id`, `applications.room_id`, `applications.status` — под запросы
«мои заявки», фильтрацию в панели администратора (Задание 2, п. 5) и выборку по
помещению.
