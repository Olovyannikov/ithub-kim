#!/usr/bin/env node
/**
 * Качает офлайн-документацию по стеку в docs/stack/.
 *
 *   pnpm stack:docs
 *
 * На площадке ДЭ интернета нет, а бэкенд пишется вживую — забытый декоратор
 * или имя опции TypeORM там не загуглить. Поэтому документация едет с собой.
 *
 * Большинство сайтов публикуют `llms-full.txt` — всю документацию одним
 * файлом, его и берём. У react.dev полного файла нет, есть только индекс
 * `llms.txt` со ссылками на страницы в markdown — его обходим постранично.
 *
 * Файлы лежат в .gitignore: в репозитории им делать нечего, а в офлайн-архив
 * (`pnpm bundle`) они попадают.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STACK_DIR = join(ROOT, 'docs', 'stack');

/** Одновременных запросов: больше — невежливо к чужим серверам. */
const CONCURRENCY = 6;

const SOURCES = [
  { name: 'effector', full: 'https://effector.dev/llms-full.txt' },
  { name: 'nestjs', full: 'https://docs.nestjs.com/llms-full.txt' },
  { name: 'typeorm', full: 'https://typeorm.io/llms-full.txt' },
  { name: 'react', index: 'https://react.dev/llms.txt' },
];

/**
 * Качает с повтором: многомегабайтный llms-full.txt регулярно обрывается на
 * середине, и без повтора документация молча уезжает на площадку неполной.
 */
async function fetchText(url, attempts = 3) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'kim-offline-docs' } });

      if (!response.ok) {
        throw new Error(`${response.status} ${url}`);
      }

      return await response.text();
    } catch (error) {
      if (attempt >= attempts) {
        return fetchViaCurl(url, error);
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

/**
 * Запасной транспорт.
 *
 * typeorm.io отдаёт llms-full.txt так, что встроенный fetch стабильно рвётся
 * с `read ETIMEDOUT`, сколько ни повторяй, — а curl тот же файл забирает
 * целиком. Чинить чужой сервер не наша задача, поэтому просто берём другой
 * инструмент.
 */
function fetchViaCurl(url, cause) {
  try {
    return execFileSync('curl', ['-sSL', '--max-time', '120', url], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    throw cause;
  }
}

/** Разбирает markdown-ссылки вида `- [Заголовок](https://…/page.md): описание`. */
function extractLinks(index, origin) {
  const links = new Map();

  for (const match of index.matchAll(/\]\((https?:\/\/[^)\s]+\.md)\)/g)) {
    const url = match[1];

    if (url.startsWith(origin)) {
      links.set(url, url.slice(origin.length).replace(/^\//, '').replaceAll('/', '__'));
    }
  }

  return [...links];
}

/** Обходит очередь пулом воркеров, чтобы не открывать сотню соединений разом. */
async function pool(items, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      await worker(queue.shift());
    }
  });

  await Promise.all(runners);
}

async function fetchFull({ name, full }) {
  const text = await fetchText(full);
  const dir = join(STACK_DIR, name);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'llms-full.txt'), text, 'utf8');

  return `${name}: ${(text.length / 1024).toFixed(0)} КБ одним файлом`;
}

async function fetchByIndex({ name, index }) {
  const origin = new URL(index).origin;
  const text = await fetchText(index);
  const links = extractLinks(text, origin);
  const dir = join(STACK_DIR, name);

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'llms-index.md'), text, 'utf8');

  let saved = 0;
  let failed = 0;

  await pool(links, async ([url, file]) => {
    try {
      await writeFile(join(dir, file), await fetchText(url), 'utf8');
      saved += 1;
    } catch {
      // Отдельная выпавшая страница не повод терять остальные.
      failed += 1;
    }
  });

  return `${name}: ${saved} страниц${failed > 0 ? `, не отдалось ${failed}` : ''}`;
}

async function main() {
  console.log('Качаю документацию по стеку — нужен интернет.\n');

  for (const source of SOURCES) {
    try {
      console.log(`  ${source.full ? await fetchFull(source) : await fetchByIndex(source)}`);
    } catch (error) {
      console.error(`  ${source.name}: не вышло — ${error.message}`);
    }
  }

  console.log('\nГотово. Файлы в docs/stack/, в репозиторий не коммитятся,');
  console.log('но попадают в офлайн-архив `pnpm bundle`.');
}

await main();
