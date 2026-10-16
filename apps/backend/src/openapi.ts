import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

import { AUTH_COOKIE_NAME } from './common/guards/jwt-auth.guard';

/**
 * Описание контракта API.
 *
 * Нужно не ради красивой страницы, а как техзадание для второй реализации
 * бэкенда на Python/MySQL (Часть 2Б): фронтенд обращается к относительному
 * `/api`, поэтому любой бэкенд, реализующий этот контракт, подключается
 * заменой прокси.
 */
export function buildOpenApiDocument(
  app: INestApplication,
): ReturnType<typeof SwaggerModule.createDocument> {
  const config = new DocumentBuilder()
    .setTitle('Конференции.РФ — API')
    .setDescription(
      'Информационная система бронирования помещений для Всероссийских конференций. ' +
        'КИМ 09.02.07-3-2027, Том 1 (инвариантная часть).',
    )
    .setVersion('1.0.0')
    .addCookieAuth(AUTH_COOKIE_NAME, {
      type: 'apiKey',
      in: 'cookie',
      description: 'httpOnly-cookie с подписанным токеном сессии (ADR-0004)',
    })
    .addTag('auth', 'Регистрация, вход, выход, текущий пользователь')
    .addTag('rooms', 'Справочник помещений для выпадающего списка')
    .addTag('applications', 'Заявки пользователя, отзывы и панель администратора')
    .addTag('health', 'Проверка работоспособности')
    .build();

  return SwaggerModule.createDocument(app, config);
}
