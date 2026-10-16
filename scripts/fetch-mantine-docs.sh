#!/usr/bin/env bash
# Обновляет вендорённую документацию Mantine в LLM-формате.
#
# Зачем: на площадке ДЭ нет интернета, а КИМ прямо предусматривает
# офлайн-справочник по технологиям. Документация лежит в репозитории и уезжает
# на экзамен вместе с ним.
#
#   pnpm mantine:docs          # индекс + getting started (небольшие файлы, в git)
#   pnpm mantine:docs:full     # плюс полный справочник ~4.6 МБ (не в git)

set -euo pipefail

cd "$(dirname "$0")/.."

OUT_DIR="docs/stack/mantine"
VERSION="$(node -p "require('./apps/web/node_modules/@mantine/core/package.json').version")"
TODAY="$(date +%F)"

mkdir -p "$OUT_DIR"

# $1 — URL, $2 — путь назначения, $3 — пояснение для шапки
fetch_with_header() {
  local url="$1" dest="$2" note="$3" tmp
  tmp="$(mktemp)"
  curl -sSL --fail -m 60 "$url" -o "$tmp"
  {
    printf '%s\n' \
      '<!--' \
      "Источник: $url" \
      "Скачано: $TODAY, Mantine $VERSION" \
      "$note" \
      '-->' \
      ''
    cat "$tmp"
  } > "$dest"
  rm -f "$tmp"
  printf '  %-44s %s\n' "$dest" "$(du -h "$dest" | cut -f1)"
}

echo "Mantine $VERSION → $OUT_DIR"

fetch_with_header \
  'https://mantine.dev/llms.txt' \
  "$OUT_DIR/llms-index.md" \
  'Индекс всех страниц документации Mantine в LLM-формате.
Нужную страницу тянуть так: curl -sL https://mantine.dev/llms/<slug>.md'

fetch_with_header \
  'https://mantine.dev/llms/getting-started.md' \
  "$OUT_DIR/getting-started.md" \
  'Файл вендорён без изменений. Не править вручную — обновлять через `pnpm mantine:docs`.'

if [[ "${1:-}" == '--full' ]]; then
  echo 'Полный справочник (~4.6 МБ, вне git):'
  curl -sSL --fail -m 300 'https://mantine.dev/llms-full.txt' -o "$OUT_DIR/llms-full.txt"
  printf '  %-44s %s\n' "$OUT_DIR/llms-full.txt" "$(du -h "$OUT_DIR/llms-full.txt" | cut -f1)"
fi

echo 'Готово.'
