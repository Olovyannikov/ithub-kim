#!/usr/bin/env node
/**
 * Переключение репозитория с pnpm на npm и обратно.
 *
 * Зачем. На площадке ДЭ может не оказаться pnpm — в перечне ПО из КИМ его
 * нет. При этом **npm есть всегда, когда есть Node**: он идёт в комплекте.
 * Поэтому запасной путь не требует ничего устанавливать.
 *
 *   node scripts/npm-fallback.mjs          # перевести на npm
 *   node scripts/npm-fallback.mjs --revert # вернуть на pnpm
 *
 * Что мешает npm в нашем репозитории и что скрипт с этим делает:
 *
 *  1. Состав воркспейсов объявлен в `pnpm-workspace.yaml`, которого npm не
 *     читает → добавляется поле `workspaces` в корневой package.json.
 *  2. Зависимость на общий пакет записана как `workspace:*` — это протокол
 *     pnpm, npm его не понимает → заменяется на `*`.
 *  3. Корневые скрипты вызывают сам `pnpm` → переписываются на `npm`.
 *
 * Изменения обратимы: `--revert` возвращает всё как было.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACES = ['apps/backend', 'apps/frontend', 'packages/shared'];

const revert = process.argv.includes('--revert');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/** Правила перевода вызовов между менеджерами. */
const TO_NPM = [
  [/pnpm --filter (\S+) (\S+)/g, 'npm run $2 -w $1'],
  [/pnpm -r (\S+)/g, 'npm run $1 --workspaces --if-present'],
  [/pnpm exec /g, 'npx '],
  [/pnpm run /g, 'npm run '],
];

const TO_PNPM = [
  [/npm run (\S+) -w (\S+)/g, 'pnpm --filter $2 $1'],
  [/npm run (\S+) --workspaces --if-present/g, 'pnpm -r $1'],
  [/npx /g, 'pnpm exec '],
  [/npm run /g, 'pnpm run '],
];

function rewrite(value, rules) {
  return rules.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), value);
}

async function main() {
  const rootPath = join(ROOT, 'package.json');
  const root = await readJson(rootPath);
  const rules = revert ? TO_PNPM : TO_NPM;

  for (const [name, command] of Object.entries(root.scripts)) {
    root.scripts[name] = rewrite(command, rules);
  }

  if (revert) {
    delete root.workspaces;
  } else {
    root.workspaces = ['apps/*', 'packages/*'];
  }

  await writeJson(rootPath, root);

  for (const workspace of WORKSPACES) {
    const path = join(ROOT, workspace, 'package.json');
    const pkg = await readJson(path);
    let changed = false;

    for (const field of ['dependencies', 'devDependencies']) {
      for (const [dep, range] of Object.entries(pkg[field] ?? {})) {
        if (!revert && range === 'workspace:*') {
          pkg[field][dep] = '*';
          changed = true;
        }

        if (revert && dep.startsWith('@kim/') && range === '*') {
          pkg[field][dep] = 'workspace:*';
          changed = true;
        }
      }
    }

    if (pkg.scripts) {
      for (const [name, command] of Object.entries(pkg.scripts)) {
        const next = rewrite(command, rules);

        if (next !== command) {
          pkg.scripts[name] = next;
          changed = true;
        }
      }
    }

    if (changed) {
      await writeJson(path, pkg);
    }
  }

  if (revert) {
    console.log('Репозиторий переведён обратно на pnpm.');
    console.log(
      'Дальше: rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install',
    );
  } else {
    console.log('Репозиторий переведён на npm.');
    console.log(
      'Дальше: rm -rf node_modules apps/*/node_modules packages/*/node_modules && npm install',
    );
    console.log('Вернуть обратно: node scripts/npm-fallback.mjs --revert');
  }
}

await main();
