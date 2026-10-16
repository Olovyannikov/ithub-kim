import { VALIDATION_MESSAGES, type UserRole } from '@kim/shared';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { UserEntity } from '../../users/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Ограничение доступа по роли. Закрывает панель администратора (ADR-0004). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: UserEntity }>();
    const role = request.user?.role;

    if (!role || !required.includes(role)) {
      throw new ForbiddenException(VALIDATION_MESSAGES.forbidden);
    }

    return true;
  }
}
