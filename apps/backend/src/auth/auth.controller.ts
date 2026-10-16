import type { UserDto } from '@kim/shared';
import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AUTH_COOKIE_NAME } from '../common/guards/jwt-auth.guard';
import type { UserEntity } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    // secure только за HTTPS: на площадке ДЭ приложение работает по http,
    // и с secure cookie просто не долетела бы.
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 5 попыток в минуту: защита от перебора (ADR-0004). */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto> {
    const user = await this.auth.register(dto);

    response.cookie(AUTH_COOKIE_NAME, await this.auth.issueToken(user), cookieOptions());

    return this.auth.toDto(user);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto> {
    const user = await this.auth.login(dto);

    response.cookie(AUTH_COOKIE_NAME, await this.auth.issueToken(user), cookieOptions());

    return this.auth.toDto(user);
  }

  @HttpCode(204)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  }

  @Get('me')
  me(@CurrentUser() user: UserEntity): UserDto {
    return this.auth.toDto(user);
  }
}
