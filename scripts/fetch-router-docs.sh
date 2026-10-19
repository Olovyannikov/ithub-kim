#!/usr/bin/env bash
# Снимает офлайн-копию документации @effector/router (router.effector.dev).
#
# Сайт на VitePress и не отдаёт ни llms.txt, ни исходный markdown, а в
# репозитории библиотеки разметки документации нет. Поэтому страницы
# скачиваются и превращаются в текст: он компактный, читается без стилей и
# ищется grep-ом — именно это нужно на площадке ДЭ без интернета.
#
#   pnpm router:docs

set -euo pipefail

cd "$(dirname "$0")/.."

OUT='docs/stack/effector-router'
BASE='https://router.effector.dev'
PAGES=(
  /introduction/getting-started
  /core/
  /core/adapters
  /core/navigation-lifecycle
  /core/create-route
  /core/create-router
  /core/create-router-controls
  /core/create-virtual-route
  /core/before-navigate
  /core/chain-route
  /core/redirect
  /core/group
  /core/track-query
  /core/query-utilities
  /core/type-guards
  /react/
  /react/router-provider
  /react/create-route-view
  /react/create-routes-view
  /react/create-lazy-route-view
  /react/use-router
  /react/use-is-opened
  /explanation/navigation-lifecycle
  /explanation/routes-and-query
)

rm -rf "$OUT"
mkdir -p "$OUT"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for page in "${PAGES[@]}"; do
  name="$(printf '%s' "${page#/}" | sed 's#/$##; s#/#__#g')"
  [[ -z "$name" ]] && name='index'

  if ! curl -sL --fail -m 30 "${BASE}${page}" -o "$TMP/page.html"; then
    echo "  пропущено: $page" >&2
    continue
  fi

  python3 - "$TMP/page.html" "$OUT/$name.md" "${BASE}${page}" <<'PY'
import html as htmllib
import re
import sys

src, dest, url = sys.argv[1], sys.argv[2], sys.argv[3]
raw = open(src, encoding='utf-8', errors='replace').read()

# Содержимое страницы лежит в <main>; остальное — навигация и темизация.
main = re.search(r'<main[^>]*>(.*?)</main>', raw, re.S)
body = main.group(1) if main else raw

body = re.sub(r'<(script|style)\b.*?</\1>', '', body, flags=re.S)
body = re.sub(r'<(h[1-6])\b[^>]*>(.*?)</\1>', lambda m: '\n\n' + '#' * int(m.group(1)[1]) + ' ' + m.group(2) + '\n', body, flags=re.S)
body = re.sub(r'<li\b[^>]*>', '\n- ', body)
body = re.sub(r'</(p|div|tr|pre)>', '\n', body)
body = re.sub(r'<br\s*/?>', '\n', body)
body = re.sub(r'<[^>]+>', '', body)
body = htmllib.unescape(body)
body = re.sub(r'[ \t]+\n', '\n', body)
body = re.sub(r'\n{3,}', '\n\n', body).strip()

with open(dest, 'w', encoding='utf-8') as f:
    f.write(f'<!--\nИсточник: {url}\nСнято скриптом scripts/fetch-router-docs.sh — не править вручную.\n-->\n\n')
    f.write(body + '\n')
PY

  printf '  %-44s %s\n' "$page" "$(du -h "$OUT/$name.md" | cut -f1)"
done

echo "страниц: $(ls "$OUT" | wc -l | tr -d ' '), объём: $(du -sh "$OUT" | cut -f1)"
