#!/usr/bin/env bash
# Тесты фронтенда на встроенном раннере Node.
#
# Модели Effector не требуют DOM, поэтому обходимся без jsdom и jest —
# меньше зависимостей в офлайн-хранилище (ADR-0006).
#
# package.json фронтенда объявляет "type": "module", но тесты компилируются в
# CommonJS (исходники рассчитаны на сборщик и не содержат расширений в
# относительных импортах). Поэтому в каталог сборки кладём собственный
# package.json, который переключает его обратно на CommonJS.

set -euo pipefail

cd "$(dirname "$0")/.."

tsc -p tsconfig.test.json
printf '{ "type": "commonjs" }\n' > dist-test/package.json
node --test "dist-test/**/*.test.js"
