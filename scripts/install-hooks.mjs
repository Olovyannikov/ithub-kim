#!/usr/bin/env node
/**
 * Ставит git-хуки, но только если ставить их есть куда.
 *
 * `lefthook install` падает с `fatal: not a git repository`, когда каталог не
 * под git. Для разработки это неважно, а на экзамене — важно: проект приезжает
 * на флешке архивом, без `.git`, и `pnpm install` в таком каталоге обрывался
 * на шаге `prepare` с ошибкой, в которой не сразу видно, что дело в хуках.
 *
 * Поэтому проверяем git заранее и молча выходим, если его нет.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

try {
  execFileSync('git', ['rev-parse', '--git-dir'], { cwd: ROOT, stdio: 'ignore' });
} catch {
  console.log('Не git-репозиторий — git-хуки не нужны, пропускаем.');
  process.exit(0);
}

// Путь к бинарю берём явно: при запуске из жизненного цикла pnpm он есть в
// PATH, а при ручном `node scripts/install-hooks.mjs` — уже нет.
const local = join(ROOT, 'node_modules', '.bin', 'lefthook');
const lefthook = existsSync(local) ? local : 'lefthook';

execFileSync(lefthook, ['install'], { cwd: ROOT, stdio: 'inherit' });
