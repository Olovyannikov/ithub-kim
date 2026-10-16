import { VALIDATION_MESSAGES, type ApiErrorResponse } from '@kim/shared';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Приводит все ответы с ошибками к единому формату ApiErrorResponse
 * (ADR-0005), чтобы фронтенд обрабатывал их одним кодом.
 *
 * Без этого фильтра guard-ы и внутренние исключения Nest отдавали бы свою
 * форму ответа — с полем `error` и англоязычными сообщениями.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(this.fromHttpException(exception));

      return;
    }

    // Непредвиденные ошибки пишем в лог целиком, а клиенту отдаём только факт:
    // детали внутренней ошибки — это подсказка атакующему.
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: VALIDATION_MESSAGES.serverError,
    } satisfies ApiErrorResponse);
  }

  private fromHttpException(exception: HttpException): ApiErrorResponse {
    const status = exception.getStatus();
    const payload = exception.getResponse();

    // Наши собственные ошибки уже в нужном формате — пропускаем как есть.
    if (typeof payload === 'object' && payload !== null && 'errors' in payload) {
      return payload as ApiErrorResponse;
    }

    const message =
      status === HttpStatus.TOO_MANY_REQUESTS
        ? VALIDATION_MESSAGES.tooManyRequests
        : this.extractMessage(payload, exception.message);

    return { statusCode: status, message };
  }

  private extractMessage(payload: unknown, fallback: string): string {
    if (typeof payload === 'string') {
      return payload;
    }

    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const value = (payload as { message: unknown }).message;

      if (typeof value === 'string') {
        return value;
      }

      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
    }

    return fallback;
  }
}
