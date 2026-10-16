import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../users/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

/**
 * Секрет не имеет значения по умолчанию намеренно: зашитый в код секрет — это
 * ровно та находка, которую ищут по критерию «подсистемы безопасности».
 * Лучше честно упасть при старте с понятным сообщением.
 */
function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'Не задан JWT_SECRET (не короче 32 символов). Скопируйте .env.example в .env ' +
        'и подставьте значение, например: openssl rand -base64 48',
    );
  }

  return secret;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: requireJwtSecret(),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
  // JwtModule и репозиторий пользователей экспортируются, потому что ими
  // пользуется глобальный JwtAuthGuard, объявленный в AppModule.
  exports: [AuthService, PasswordService, JwtModule, TypeOrmModule],
})
export class AuthModule {}
