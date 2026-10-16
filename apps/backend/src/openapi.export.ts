import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { buildOpenApiDocument } from './openapi';

/**
 * Выгружает контракт API в файл, не поднимая сервер.
 *
 * Файл коммитится: именно он — техзадание для Python-версии (Часть 2Б), и по
 * его истории в git видно, когда контракт менялся.
 */
async function exportSpec(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  // Префикс обязателен: без него в контракте оказались бы пути без /api,
  // и вторая реализация бэкенда построила бы неверные маршруты.
  app.setGlobalPrefix('api');
  await app.init();

  const document = buildOpenApiDocument(app);
  const target = join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.json');

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();

  // eslint-disable-next-line no-console
  console.log(`[openapi] контракт выгружен: ${target}`);
}

void exportSpec().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[openapi] не удалось выгрузить контракт:', error);
  process.exitCode = 1;
});
