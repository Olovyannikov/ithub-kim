import { VALIDATION_MESSAGES, type ApiErrorResponse } from '@kim/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Ошибки бизнес-правил отдаются в том же формате, что и ошибки валидации
 * (ADR-0005), чтобы фронтенд раскладывал их по полям формы одним кодом.
 */
function body(
  statusCode: number,
  errors: Record<string, string>,
  message?: string,
): ApiErrorResponse {
  const first = Object.values(errors)[0];

  return {
    statusCode,
    message: message ?? first ?? VALIDATION_MESSAGES.validationFailed,
    errors,
  };
}

export function badRequestField(field: string, message: string): BadRequestException {
  return new BadRequestException(body(400, { [field]: message }));
}

export function conflictField(field: string, message: string): ConflictException {
  return new ConflictException(body(409, { [field]: message }));
}

export function unauthorizedField(field: string, message: string): UnauthorizedException {
  return new UnauthorizedException(body(401, { [field]: message }));
}

export function notFoundField(field: string, message: string): NotFoundException {
  return new NotFoundException(body(404, { [field]: message }));
}

export function forbiddenField(field: string, message: string): ForbiddenException {
  return new ForbiddenException(body(403, { [field]: message }));
}
