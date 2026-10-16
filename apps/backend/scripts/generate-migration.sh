#!/usr/bin/env bash
# Генерирует миграцию по разнице между сущностями и текущей базой.
#
#   pnpm --filter @kim/backend db:migrate:generate AddSomething
#
# CLI TypeORM работает по собранному dist (без ts-node — он несовместим
# с TypeScript 6), поэтому сначала собираем. Сгенерированный файл не
# соответствует нашему стандарту кодирования, поэтому в конце прогоняем
# prettier и eslint --fix.

set -euo pipefail

cd "$(dirname "$0")/.."

NAME="${1:-}"
if [[ -z "$NAME" ]]; then
  echo 'Укажите имя миграции, например: db:migrate:generate AddReviewRating' >&2
  exit 1
fi

pnpm run build
node node_modules/typeorm/cli.js migration:generate \
  -d dist/database/data-source.js \
  "src/database/migrations/$NAME"
pnpm run db:migrations:format
