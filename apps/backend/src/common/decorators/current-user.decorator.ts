import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { UserEntity } from '../../users/user.entity';

/**
 * Текущий пользователь, положенный в запрос JwtAuthGuard.
 *
 * Важно: идентификатор пользователя берётся отсюда, а не из тела или параметров
 * запроса. Клиенту физически нечем попросить чужие данные (ADR-0004).
 */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ user?: UserEntity }>();

  return request.user;
});
