# Поднять базу данных: три способа

Docker **в перечне ПО из КИМ не упомянут**, поэтому полагаться на него нельзя. Ниже три
пути: удобный локальный, экзаменационный без Docker и план отхода на MySQL. Все команды
прогнаны на этой машине 16.10.2026.

Приложение берёт строку подключения из `DATABASE_URL` в `.env` в корне репозитория.
Больше ничего менять не нужно — ни при одном из способов.

---

## Способ 1. Docker (удобно на своей машине)

```bash
cp .env.example .env
pnpm db:up                              # PostgreSQL 17 в контейнере
pnpm --filter @kim/backend db:migrate   # создать таблицы
pnpm --filter @kim/backend db:seed      # наполнить справочник помещений
```

`.env` при этом уже содержит рабочее значение:

```
DATABASE_URL=postgresql://kim:kim@localhost:5432/conferences
```

Полезное: `pnpm db:logs` — логи, `pnpm db:reset` — пересоздать базу с нуля (удаляет
данные), `pnpm db:down` — остановить.

---

## Способ 2. Локальный PostgreSQL, без Docker

Это **основной путь для экзамена**. Проверено на PostgreSQL 14.17 — схема и миграции
работают и на старых версиях, не только на 17.

### Установка

| ОС               | Команда                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| macOS (Homebrew) | `brew install postgresql@17` и `brew services start postgresql@17`             |
| macOS (без brew) | [Postgres.app](https://postgresapp.com) — перетащить в Applications, запустить |
| Debian / Ubuntu  | `sudo apt install postgresql` (сервис стартует сам)                            |
| Windows          | установщик с postgresql.org, запомнить пароль пользователя `postgres`          |

### Создать пользователя и базу

```bash
# macOS/Linux: работаем от своего пользователя, он обычно суперпользователь кластера
createuser --createdb kim
createdb --owner=kim conferences
psql -d postgres -c "ALTER USER kim WITH PASSWORD 'kim';"
```

На Windows и в дистрибутивах, где суперпользователь — `postgres`:

```bash
psql -U postgres -c "CREATE USER kim WITH PASSWORD 'kim' CREATEDB;"
psql -U postgres -c "CREATE DATABASE conferences OWNER kim;"
```

### Прописать подключение

В `.env`:

```
DATABASE_URL=postgresql://kim:kim@localhost:5432/conferences
```

Если пароль не задавали и используется локальная trust-аутентификация, пароль из строки
можно убрать: `postgresql://kim@localhost:5432/conferences`.

### Создать схему и наполнить справочники

```bash
pnpm --filter @kim/backend db:migrate
pnpm --filter @kim/backend db:seed
```

### Полностью изолированный кластер (ничего не ставить в систему)

Пригодится, когда на машине уже есть чужой PostgreSQL и ломать его нельзя. Поднимаем
свой кластер в отдельном каталоге на своём порту:

```bash
initdb -D ./pgdata -U kim --encoding=UTF8 --locale=ru_RU.UTF-8
pg_ctl -D ./pgdata -o "-p 5433 -k /tmp" -l ./pgdata/server.log start
createdb -h localhost -p 5433 -U kim conferences

# в .env
DATABASE_URL=postgresql://kim@localhost:5433/conferences
```

Остановить: `pg_ctl -D ./pgdata stop`.

`-k /tmp` обязателен: PostgreSQL кладёт unix-сокет в каталог данных, а путь к сокету
ограничен 103 байтами — на длинном пути сервер не стартует с ошибкой
«Unix-domain socket path is too long».

---

## Способ 3. MySQL на общем сервере площадки

КИМ описывает сервер «с поддержкой MySQL, PHP, SSH, SFTP, FTP, Python». Если PostgreSQL
на площадке не окажется, переход выглядит так (план отхода из
[ADR-0001](./adr/0001-stack.md), сущности при этом **не меняются**):

```bash
pnpm --filter @kim/backend add mysql2
```

В `apps/backend/src/database/data-source.options.ts` — одна строка:

```diff
-  type: 'postgres',
+  type: 'mysql',
```

И строка подключения в `.env`:

```
DATABASE_URL=mysql://kim:kim@localhost:3306/conferences
```

Дальше те же `db:migrate` и `db:seed`. Уже существующую миграцию придётся
перегенерировать под диалект MySQL: удалить файл из
`apps/backend/src/database/migrations/`, выполнить
`pnpm --filter @kim/backend db:migrate:generate src/database/migrations/InitialSchema`
на пустой базе. Поэтому в схеме нет нативных enum и других вещей, специфичных для
PostgreSQL — чтобы этот шаг был механическим (ADR-0003).

---

## Если что-то не поднимается

**`FATAL: lock file "postmaster.pid" already exists`** — остался файл блокировки после
некорректного завершения. Проверить, что процесса действительно нет
(`pgrep -l postgres`; PID из файла может уже принадлежать другой программе), и удалить
файл:

```bash
rm /opt/homebrew/var/postgresql@17/postmaster.pid   # путь зависит от установки
brew services restart postgresql@17
```

**`could not create any Unix-domain sockets`** — слишком длинный путь к каталогу данных,
см. `-k /tmp` выше.

**`database "conferences" does not exist`** — база не создана: вернуться к шагу
`createdb`.

**`password authentication failed`** — пароль пользователя не совпадает со строкой в
`.env`; задать заново через `ALTER USER kim WITH PASSWORD 'kim';`.

**`locale "ru_RU.UTF-8" is not available`** — локаль не установлена в системе. Для нашей
схемы это не критично, можно обойтись без неё: `initdb ... --locale=C --encoding=UTF8`.
Отличие будет только в порядке сортировки русских строк.

---

## Проверить, что всё сошлось

```bash
pnpm --filter @kim/backend db:schema:log
```

Пустой вывод (точнее, «Your schema is up to date») означает, что состояние базы совпадает
с сущностями в коде. Это же и подтверждает актуальность ER-диаграммы — см.
[docs/er](./er/README.md).
