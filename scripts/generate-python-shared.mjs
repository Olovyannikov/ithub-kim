#!/usr/bin/env node
/**
 * Переносит правила и тексты из `@kim/shared` в Python.
 *
 * Два бэкенда неизбежно расходятся, и расходятся они в самом дорогом месте —
 * в формулировках и правилах из ТЗ: подписи статусов, способы оплаты,
 * сообщения об ошибках, регулярные выражения полей. Эксперт сверяет их с
 * текстом КИМ дословно.
 *
 * Поэтому правила не дублируются, а переносятся: источник остаётся один —
 * `packages/shared` (ADR-0005, ADR-0011).
 *
 *   pnpm shared:python
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'apps', 'backend-py', 'app', 'shared_generated.py');

const require = createRequire(join(ROOT, 'packages', 'shared', 'package.json'));
const shared = require(join(ROOT, 'packages', 'shared', 'dist', 'index.js'));

/** Превращает JavaScript-регулярку в строку шаблона для модуля `re`. */
function toPythonPattern(regexp) {
  return regexp.source;
}

function pyString(value) {
  return JSON.stringify(value);
}

function pyList(values) {
  return `[\n${values.map((v) => `    ${pyString(v)},`).join('\n')}\n]`;
}

function pyDict(entries) {
  return `{\n${entries.map(([k, v]) => `    ${pyString(k)}: ${pyString(v)},`).join('\n')}\n}`;
}

const lines = [
  '"""',
  'Правила и тексты из технического задания.',
  '',
  'ФАЙЛ СГЕНЕРИРОВАН. Не править руками: источник — packages/shared,',
  'обновляется командой `pnpm shared:python` (ADR-0011).',
  '"""',
  '',
  'from typing import Final',
  '',
  '# Типы помещений, способы оплаты и статусы заявки — дословно из КИМ.',
  `ROOM_KINDS: Final[list[str]] = ${pyList([...shared.ROOM_KINDS])}`,
  '',
  `PAYMENT_METHODS: Final[list[str]] = ${pyList([...shared.PAYMENT_METHODS])}`,
  '',
  `APPLICATION_STATUSES: Final[list[str]] = ${pyList([...shared.APPLICATION_STATUSES])}`,
  '',
  `APPLICATION_STATUS_INITIAL: Final[str] = ${pyString(shared.APPLICATION_STATUS_INITIAL)}`,
  '',
  `APPLICATION_STATUSES_ADMIN_ASSIGNABLE: Final[list[str]] = ${pyList([
    ...shared.APPLICATION_STATUSES_ADMIN_ASSIGNABLE,
  ])}`,
  '',
  `USER_ROLES: Final[list[str]] = ${pyList([...shared.USER_ROLES])}`,
  '',
  `ADMIN_LOGIN: Final[str] = ${pyString(shared.ADMIN_LOGIN)}`,
  '',
  '# Правила валидации полей регистрации — Задание 1, п. 1.',
  `LOGIN_PATTERN: Final[str] = ${pyString(toPythonPattern(shared.LOGIN_PATTERN))}`,
  `FULL_NAME_PATTERN: Final[str] = ${pyString(toPythonPattern(shared.FULL_NAME_PATTERN))}`,
  `PHONE_PATTERN: Final[str] = ${pyString(toPythonPattern(shared.PHONE_PATTERN))}`,
  `EMAIL_PATTERN: Final[str] = ${pyString(toPythonPattern(shared.EMAIL_PATTERN))}`,
  `PASSWORD_MIN_LENGTH: Final[int] = ${shared.PASSWORD_MIN_LENGTH}`,
  `LOGIN_MIN_LENGTH: Final[int] = ${shared.LOGIN_MIN_LENGTH}`,
  `RATING_MIN: Final[int] = ${shared.RATING_MIN}`,
  `RATING_MAX: Final[int] = ${shared.RATING_MAX}`,
  '',
  '# Сообщения об ошибках — выводятся на форме.',
  `MESSAGES: Final[dict[str, str]] = ${pyDict(Object.entries(shared.VALIDATION_MESSAGES))}`,
  '',
  '',
  'def can_leave_review(status: str) -> bool:',
  '    """Отзыв можно оставить только после завершения мероприятия."""',
  `    return status == ${pyString('Завершено')}`,
  '',
];

await mkdir(dirname(TARGET), { recursive: true });
await writeFile(TARGET, `${lines.join('\n')}`, 'utf8');

console.log(
  `[shared:python] перенесено правил: ${Object.keys(shared.VALIDATION_MESSAGES).length} сообщений, ` +
    `${shared.APPLICATION_STATUSES.length} статусов, ${shared.ROOM_KINDS.length} типов помещений`,
);
console.log(`[shared:python] файл: ${TARGET}`);
