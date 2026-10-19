#!/usr/bin/env node
/**
 * Собирает архив для переноса проекта на экзаменационную машину.
 *
 * На площадке нет интернета, а `pnpm install` без сети опирается на store,
 * которого на чужой машине тоже нет. Поэтому в архив кладётся уже собранный
 * `node_modules`: распаковал — и сразу `pnpm build`, без шага установки.
 *
 *   pnpm bundle
 *
 * Ограничение, о котором нужно помнить: внутри `node_modules` лежат бинарники
 * под текущую платформу (esbuild, sharp, lightningcss). Архив переносится между
 * машинами с той же ОС и архитектурой. План отхода на чужой платформе —
 * `pnpm install` с сетью или запасной бэкенд на Python, см. docs/offline.md.
 *
 * Про исключения. bsdtar матчит односегментный паттерн по имени файла в любом
 * месте дерева: `--exclude='./dist'` вырезает `dist` и внутри `node_modules`,
 * а там он есть у половины пакетов — архив получается тихо битым. Поэтому все
 * пути ниже многосегментные: такие libarchive матчит точно.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'offline');

/** Многосегментные пути — иначе вырежется лишнее внутри node_modules. */
const EXCLUDES = [
  './.git',
  './apps/backend/dist',
  './apps/backend/dist-test',
  './apps/frontend/dist',
  './packages/shared/dist',
  './apps/backend-py/.venv',
  './offline',
  '.DS_Store',
];

function run(file, args, options = {}) {
  return execFileSync(file, args, { encoding: 'utf8', ...options });
}

function mb(path) {
  return `${(statSync(path).size / 1024 / 1024).toFixed(0)} МБ`;
}

function checkPrerequisites() {
  try {
    statSync(join(ROOT, 'node_modules'));
  } catch {
    throw new Error('Нет node_modules. Сначала `pnpm install`, иначе архив бесполезен.');
  }

  // Колёса — единственный способ поднять запасной бэкенд без сети. Само
  // окружение .venv не переносится: в шебангах её скриптов абсолютные пути.
  try {
    statSync(join(ROOT, 'apps', 'backend-py', 'wheels'));
  } catch {
    console.warn(
      'Внимание: нет apps/backend-py/wheels — запасной бэкенд на площадке не поднять.\n' +
        'Скачать заранее: pnpm py:wheels\n',
    );
  }
}

/**
 * Проверяет архив распаковкой и сборкой.
 *
 * Без этого шага битый архив обнаружится только на площадке, когда чинить его
 * будет уже некогда.
 */
function verify(archive) {
  const sandbox = mkdtempSync(join(tmpdir(), 'kim-bundle-'));

  try {
    run('tar', ['-xzf', archive, '-C', sandbox]);
    run('pnpm', ['build'], { cwd: sandbox, stdio: 'pipe' });
    console.log('  проверка: распаковался и собрался без сети и без install');
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

function main() {
  checkPrerequisites();

  const stamp = new Date().toISOString().slice(0, 10);
  const name = `kim-offline-${stamp}.tgz`;

  // Пишем во временный каталог, чтобы растущий архив не попал сам в себя.
  const staging = mkdtempSync(join(tmpdir(), 'kim-stage-'));
  const staged = join(staging, name);

  console.log('Собираю архив — это около минуты.');

  try {
    run('tar', ['-czf', staged, ...EXCLUDES.flatMap((path) => ['--exclude', path]), '.'], {
      cwd: ROOT,
    });

    verify(staged);

    mkdirSync(OUT_DIR, { recursive: true });
    const target = join(OUT_DIR, name);
    try {
      renameSync(staged, target);
    } catch {
      // Временный каталог может оказаться на другом томе — тогда копируем.
      run('cp', [staged, target]);
    }

    console.log(`\n  offline/${name} — ${mb(target)}`);
    console.log('\nНа экзаменационной машине:');
    console.log('  tar -xzf kim-offline-*.tgz -C ~/project && cd ~/project && pnpm build');
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

main();
