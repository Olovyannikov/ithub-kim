import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { Injectable } from '@nestjs/common';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

/**
 * Хеширование паролей на `scrypt` из встроенного `node:crypto` — ноль
 * зависимостей и ничего не собирается при установке, что критично для офлайна
 * (ADR-0004).
 *
 * Формат строки: `scrypt$N$r$p$<salt base64>$<hash base64>`. Параметры лежат
 * внутри хеша, поэтому их можно поднять позже, не ломая уже сохранённые пароли.
 *
 * Алгоритм намеренно спрятан за этим сервисом: если понадобится bcrypt,
 * меняется только содержимое двух методов.
 */
@Injectable()
export class PasswordService {
  private readonly N = 16384;
  private readonly r = 8;
  private readonly p = 1;
  private readonly keyLength = 64;
  private readonly saltLength = 16;

  async hash(password: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    const derived = await this.derive(password, salt);

    return [
      'scrypt',
      this.N,
      this.r,
      this.p,
      salt.toString('base64'),
      derived.toString('base64'),
    ].join('$');
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const parts = stored.split('$');

    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return false;
    }

    const [, rawN, rawR, rawP, rawSalt, rawHash] = parts;
    const N = Number(rawN);
    const r = Number(rawR);
    const p = Number(rawP);

    if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
      return false;
    }

    const salt = Buffer.from(rawSalt ?? '', 'base64');
    const expected = Buffer.from(rawHash ?? '', 'base64');
    const actual = await this.derive(password, salt, { N, r, p, keyLength: expected.length });

    // Длины обязательно сверяем до timingSafeEqual: при разной длине он бросает.
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private derive(
    password: string,
    salt: Buffer,
    options?: { N: number; r: number; p: number; keyLength: number },
  ): Promise<Buffer> {
    const N = options?.N ?? this.N;
    const r = options?.r ?? this.r;
    const p = options?.p ?? this.p;
    const keyLength = options?.keyLength ?? this.keyLength;

    return scryptAsync(password.normalize('NFKC'), salt, keyLength, { N, r, p });
  }
}
