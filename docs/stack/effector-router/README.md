# Документация @effector/router (офлайн-копия)

Источник: https://router.effector.dev — обновляется командой `pnpm router:docs`.

Сайт собран на VitePress: он не отдаёт ни `llms.txt`, ни исходный markdown, а в
репозитории библиотеки разметки документации нет. Поэтому скрипт
`scripts/fetch-router-docs.sh` скачивает страницы и переводит их в текст — он компактный,
читается без стилей и ищется `grep`-ом. Это важно: на площадке ДЭ интернета нет, а КИМ
прямо предусматривает офлайн-справочник по технологиям.

## Что где

| Файл                                | О чём                                              |
| ----------------------------------- | -------------------------------------------------- |
| `introduction__getting-started.md`  | установка и первый роутер                          |
| `core__create-route.md`             | `createRoute`, состав роута, события жизненного цикла |
| `core__create-router.md`            | `createRouter`, `setHistory`, `historyAdapter`      |
| `core__chain-route.md`              | защищённые маршруты через цепочки                   |
| `core__redirect.md`                 | переходы                                            |
| `core__navigation-lifecycle.md`     | порядок событий при навигации                       |
| `react__*.md`                       | `RouterProvider`, `createRouteView`, `createRoutesView`, хуки |
| `explanation__routes-and-query.md`  | модель роутов и query                               |

## Осторожно с именем пакета

В npm по запросу «effector router» находится **`atomic-router`** — это **прежнее имя**
библиотеки, последняя версия 0.12.0 и другой API. Актуальный пакет — **`@effector/router`**
(и `@effector/router-react` для React). Подробнее — в
[ADR-0006](../../adr/0006-frontend-architecture.md).
