import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // TODO (Часть 2, ADR-0005): глобальный ValidationPipe с whitelist и
  // forbidNonWhitelisted. Подключается вместе с выбранной библиотекой схем —
  // в каркасе не фиксируем, чтобы не пре-коммитить решение.

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`[api] http://localhost:${port}/api`);
}

void bootstrap();
