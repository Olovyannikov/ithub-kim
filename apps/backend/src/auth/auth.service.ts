import { VALIDATION_MESSAGES, type UserDto } from '@kim/shared';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { conflictField, unauthorizedField } from '../common/validation/field-errors';
import { UserEntity } from '../users/user.entity';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  /** Задание 1, п. 1: «По кнопке "Создать пользователя" данные заносятся в базу данных». */
  async register(dto: RegisterDto): Promise<UserEntity> {
    const taken = await this.users.exists({ where: { login: dto.login } });

    if (taken) {
      throw conflictField('login', VALIDATION_MESSAGES.loginTaken);
    }

    const user = this.users.create({
      login: dto.login,
      passwordHash: await this.passwords.hash(dto.password),
      fullName: dto.fullName.trim(),
      phone: dto.phone,
      email: dto.email,
      // Роль не принимается из запроса ни при каких условиях: whitelist в
      // ValidationPipe отбросил бы лишнее поле, но полагаться только на него
      // не стоит (ADR-0005).
      role: 'user',
    });

    return this.users.save(user);
  }

  /**
   * Задание 1, п. 2: «Попытки некорректного ввода логина и пароля должны
   * сопровождаться сообщениями».
   *
   * Сообщение одно и то же независимо от того, не найден логин или не совпал
   * пароль — иначе форма входа становится способом узнать существующие логины
   * (ADR-0004). Пароль проверяется и для несуществующего пользователя, чтобы
   * по времени ответа нельзя было отличить один случай от другого.
   */
  async login(dto: LoginDto): Promise<UserEntity> {
    const user = await this.users.findOne({ where: { login: dto.login } });
    const stored = user?.passwordHash ?? 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AA==';
    const matches = await this.passwords.verify(dto.password, stored);

    if (!user || !matches) {
      throw unauthorizedField('login', VALIDATION_MESSAGES.credentials);
    }

    return user;
  }

  async issueToken(user: UserEntity): Promise<string> {
    return this.jwt.signAsync({ sub: user.id });
  }

  /** Пользователь в ответах API: без хеша пароля и служебных полей. */
  toDto(user: UserEntity): UserDto {
    return {
      id: user.id,
      login: user.login,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };
  }
}
