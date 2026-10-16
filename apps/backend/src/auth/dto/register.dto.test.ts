import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VALIDATION_MESSAGES } from '@kim/shared';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from './register.dto';

/**
 * Проверка правил регистрации **дословно по КИМ**, Задание 1, п. 1.
 * Это самый ценный тест в проекте: он сверяет код с текстом ТЗ.
 */
async function errorsFor(payload: Record<string, unknown>): Promise<Record<string, string>> {
  const dto = plainToInstance(RegisterDto, payload);
  const errors = await validate(dto, { stopAtFirstError: true, whitelist: true });

  return Object.fromEntries(
    errors.map((error) => [error.property, Object.values(error.constraints ?? {})[0] ?? '']),
  );
}

const VALID = {
  login: 'ivanov01',
  password: 'StrongPass1',
  fullName: 'Иванов Иван Иванович',
  phone: '8(999)123-45-67',
  email: 'ivanov@example.ru',
};

describe('RegisterDto — правила из ТЗ', () => {
  it('пропускает корректные данные', async () => {
    assert.deepEqual(await errorsFor(VALID), {});
  });

  it('логин: латиница и цифры, не менее 6 символов', async () => {
    for (const login of ['abcde', 'иванов01', 'ivan ov', 'ivan-ov', 'ivan_ov', '']) {
      const errors = await errorsFor({ ...VALID, login });

      assert.ok(errors.login, `логин «${login}» должен быть отклонён`);
    }

    for (const login of ['abcdef', 'ivanov01', 'IVANOV2027', '123456']) {
      const errors = await errorsFor({ ...VALID, login });

      assert.equal(errors.login, undefined, `логин «${login}» должен быть принят`);
    }
  });

  it('пароль: минимум 8 символов', async () => {
    assert.equal(
      (await errorsFor({ ...VALID, password: '1234567' })).password,
      VALIDATION_MESSAGES.password,
    );
    assert.equal((await errorsFor({ ...VALID, password: '12345678' })).password, undefined);
  });

  it('ФИО: только кириллица и пробелы', async () => {
    for (const fullName of ['Ivanov Ivan', 'Иванов Иван 2', 'Иванов-Петров', '']) {
      assert.ok(
        (await errorsFor({ ...VALID, fullName })).fullName,
        `ФИО «${fullName}» должно быть отклонено`,
      );
    }

    assert.equal(
      (await errorsFor({ ...VALID, fullName: 'Иванов Иван Иванович' })).fullName,
      undefined,
    );
    assert.equal((await errorsFor({ ...VALID, fullName: 'Ёлкина Аделаида' })).fullName, undefined);
  });

  it('телефон строго в формате 8(XXX)XXX-XX-XX', async () => {
    for (const phone of [
      '89991234567',
      '+7(999)123-45-67',
      '8(999)123-45-6',
      '8(99)123-45-67',
      '8 (999) 123-45-67',
    ]) {
      assert.equal(
        (await errorsFor({ ...VALID, phone })).phone,
        VALIDATION_MESSAGES.phone,
        `телефон «${phone}» должен быть отклонён`,
      );
    }

    assert.equal((await errorsFor({ ...VALID, phone: '8(999)123-45-67' })).phone, undefined);
  });

  it('email в формате электронной почты', async () => {
    for (const email of [
      'ivanov',
      'ivanov@',
      '@example.ru',
      'ivanov@example',
      'иванов@example.ru ',
    ]) {
      assert.ok(
        (await errorsFor({ ...VALID, email })).email,
        `email «${email}» должен быть отклонён`,
      );
    }

    assert.equal((await errorsFor({ ...VALID, email: 'ivanov@example.ru' })).email, undefined);
  });

  it('все поля обязательны', async () => {
    const errors = await errorsFor({});

    for (const field of ['login', 'password', 'fullName', 'phone', 'email']) {
      assert.ok(errors[field], `поле ${field} должно быть обязательным`);
    }
  });
});
