#!/usr/bin/env bash
# Готовит окружение запасного бэкенда на Python (ADR-0011).
#
#   pnpm py:install
#
# Прокси с подменой сертификата ломает проверку TLS у pip, поэтому хосты PyPI
# помечены доверенными. На площадке ДЭ сети нет вовсе — там ставится из
# заранее скачанных колёс:
#   pip download -r requirements.txt -d wheels
#   pip install --no-index --find-links=wheels -r requirements.txt

set -euo pipefail

cd "$(dirname "$0")/../apps/backend-py"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

PIP_ARGS=(--trusted-host pypi.org --trusted-host files.pythonhosted.org)

if [[ -d wheels ]]; then
  echo 'Ставим из локальных колёс (офлайн)'
  .venv/bin/python -m pip install --no-index --find-links=wheels -r requirements.txt
else
  .venv/bin/python -m pip install --upgrade pip "${PIP_ARGS[@]}" >/dev/null
  .venv/bin/python -m pip install -r requirements.txt "${PIP_ARGS[@]}"
fi

echo 'Готово. Запуск: pnpm py:dev'
