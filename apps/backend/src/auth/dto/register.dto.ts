import {
  EMAIL_PATTERN,
  FULL_NAME_PATTERN,
  LOGIN_PATTERN,
  PASSWORD_MIN_LENGTH,
  PHONE_PATTERN,
  VALIDATION_MESSAGES,
} from '@kim/shared';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * Регистрация — Задание 1, п. 1. Все поля обязательны.
 *
 * Ни одного регулярного выражения и ни одной формулировки ошибки здесь нет:
 * и шаблоны, и сообщения импортируются из @kim/shared, иначе клиентская и
 * серверная валидация разойдутся (ADR-0005).
 */
export class RegisterDto {
  @IsString({ message: VALIDATION_MESSAGES.required })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.required })
  @Matches(LOGIN_PATTERN, { message: VALIDATION_MESSAGES.login })
  login: string;

  @IsString({ message: VALIDATION_MESSAGES.required })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.required })
  @MinLength(PASSWORD_MIN_LENGTH, { message: VALIDATION_MESSAGES.password })
  password: string;

  @IsString({ message: VALIDATION_MESSAGES.required })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.required })
  @Matches(FULL_NAME_PATTERN, { message: VALIDATION_MESSAGES.fullName })
  fullName: string;

  @IsString({ message: VALIDATION_MESSAGES.required })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.required })
  @Matches(PHONE_PATTERN, { message: VALIDATION_MESSAGES.phone })
  phone: string;

  @IsString({ message: VALIDATION_MESSAGES.required })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.required })
  @Matches(EMAIL_PATTERN, { message: VALIDATION_MESSAGES.email })
  email: string;
}
