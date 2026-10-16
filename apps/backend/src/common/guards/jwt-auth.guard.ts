import { VALIDATION_MESSAGES } from '@kim/shared';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';

import { UserEntity } from '../../users/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const AUTH_COOKIE_NAME = 'conf_session';

interface TokenPayload {
  sub: number;
}

/**
 * Проверяет подпись токена из httpOnly-cookie и подкладывает в запрос
 * пользователя, прочитанного из базы.
 *
 * Пользователь читается каждый раз, а не берётся из токена: смена роли
 * действует сразу, и в токене не оказывается данных, которым можно было бы
 * устареть (ADR-0004). Цена — один запрос к базе на защищённый вызов.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: UserEntity }>();
    const token = (request.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException(VALIDATION_MESSAGES.unauthorized);
    }

    let payload: TokenPayload;

    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException(VALIDATION_MESSAGES.unauthorized);
    }

    const user = await this.users.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException(VALIDATION_MESSAGES.unauthorized);
    }

    request.user = user;

    return true;
  }
}
