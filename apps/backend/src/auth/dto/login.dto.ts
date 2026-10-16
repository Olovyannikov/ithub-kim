import { VALIDATION_MESSAGES } from '@kim/shared';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Вход — Задание 1, п. 2.
 *
 * Здесь намеренно нет проверки формата логина и длины пароля: на входе такие
 * сообщения подсказывали бы перебирающему, что он угадал формат. Ответ при
 * неудачном входе всегда один — «Неверный логин или пароль» (ADR-0004).
 */
export class LoginDto {
  @IsString({ message: VALIDATION_MESSAGES.required })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.required })
  login: string;

  @IsString({ message: VALIDATION_MESSAGES.required })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.required })
  password: string;
}
