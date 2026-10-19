import { VALIDATION_MESSAGES } from '@kim/shared';
import { describe, expect, it } from 'vitest';

import { validators } from './validators';

/**
 * Те же правила из ТЗ, что проверяет бэкенд в `register.dto.test.ts`.
 *
 * Смысл этого теста — доказать, что клиент и сервер валидируют одинаково:
 * оба берут шаблоны и сообщения из `@kim/shared` (ADR-0005). Если здесь и там
 * результаты разойдутся, значит правило где-то продублировано руками.
 */
describe('validators — правила регистрации из ТЗ', () => {
  it('логин: латиница и цифры, не менее 6 символов', () => {
    for (const bad of ['', 'abcde', 'иванов01', 'ivan ov', 'ivan-ov', 'ivan_ov']) {
      expect(validators.login(bad), `логин «${bad}» должен быть отклонён`).toBeTruthy();
    }

    for (const good of ['abcdef', 'ivanov01', 'IVANOV2027', '123456']) {
      expect(validators.login(good), `логин «${good}» должен быть принят`).toBe(null);
    }
  });

  it('пароль: минимум 8 символов', () => {
    expect(validators.password('1234567')).toBe(VALIDATION_MESSAGES.password);
    expect(validators.password('12345678')).toBe(null);
    expect(validators.password('')).toBe(VALIDATION_MESSAGES.required);
  });

  it('ФИО: только кириллица и пробелы', () => {
    for (const bad of ['Ivanov Ivan', 'Иванов Иван 2', 'Иванов-Петров', '']) {
      expect(validators.fullName(bad), `ФИО «${bad}» должно быть отклонено`).toBeTruthy();
    }

    expect(validators.fullName('Иванов Иван Иванович')).toBe(null);
    expect(validators.fullName('Ёлкина Аделаида')).toBe(null);
  });

  it('телефон строго в формате 8(XXX)XXX-XX-XX', () => {
    for (const bad of ['89991234567', '+7(999)123-45-67', '8(999)123-45-6', '8 (999) 123-45-67']) {
      expect(validators.phone(bad), `телефон «${bad}»`).toBe(VALIDATION_MESSAGES.phone);
    }

    expect(validators.phone('8(999)123-45-67')).toBe(null);
  });

  it('email в формате электронной почты', () => {
    for (const bad of ['ivanov', 'ivanov@', '@example.ru', 'ivanov@example']) {
      expect(validators.email(bad), `email «${bad}» должен быть отклонён`).toBeTruthy();
    }

    expect(validators.email('ivanov@example.ru')).toBe(null);
  });

  it('на форме входа формат не проверяется — только заполненность', () => {
    expect(validators.notEmpty('')).toBe(VALIDATION_MESSAGES.required);
    // Короткий логин на входе валиден: иначе форма подсказывала бы формат.
    expect(validators.notEmpty('ab')).toBe(null);
  });

  it('дата начала конференции не может быть в прошлом', () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);

    expect(validators.startsAt(past)).toBe(VALIDATION_MESSAGES.startsAtPast);
    expect(validators.startsAt(future)).toBe(null);
    expect(validators.startsAt(null)).toBe(VALIDATION_MESSAGES.startsAtRequired);
    expect(validators.startsAt('не дата')).toBe(VALIDATION_MESSAGES.startsAtInvalid);
  });

  it('оценка отзыва — целое от 1 до 5', () => {
    for (const bad of [0, 6, 2.5, null]) {
      expect(validators.rating(bad), `оценка ${String(bad)} должна быть отклонена`).toBeTruthy();
    }

    for (const good of [1, 3, 5]) {
      expect(validators.rating(good)).toBe(null);
    }
  });
});
