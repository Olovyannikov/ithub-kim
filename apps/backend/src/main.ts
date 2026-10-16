import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { validationExceptionFactory } from './common/validation/validation-exception.factory';
import { buildOpenApiDocument } from './openapi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalFilters(new ApiExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist + forbidNonWhitelisted — это и есть защита от присвоения
      // лишних полей: `role: "admin"` в теле регистрации будет отклонено,
      // а не применено частично (ADR-0005).
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // Интерактивная документация доступна локально; на площадке её можно
  // отключить переменной окружения, чтобы не отдавать описание API наружу.
  if (process.env.API_DOCS !== 'false') {
    SwaggerModule.setup('api/docs', app, buildOpenApiDocument(app));
  }

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`[api] http://localhost:${port}/api`);
}

void bootstrap();
