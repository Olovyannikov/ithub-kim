import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VALIDATION_MESSAGES } from '@kim/shared';

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
      assert.ok(validators.login(bad), `логин «${bad}» должен быть отклонён`);
    }

    for (const good of ['abcdef', 'ivanov01', 'IVANOV2027', '123456']) {
      assert.equal(validators.login(good), null, `логин «${good}» должен быть принят`);
    }
  });

  it('пароль: минимум 8 символов', () => {
    assert.equal(validators.password('1234567'), VALIDATION_MESSAGES.password);
    assert.equal(validators.password('12345678'), null);
    assert.equal(validators.password(''), VALIDATION_MESSAGES.required);
  });

  it('ФИО: только кириллица и пробелы', () => {
    for (const bad of ['Ivanov Ivan', 'Иванов Иван 2', 'Иванов-Петров', '']) {
      assert.ok(validators.fullName(bad), `ФИО «${bad}» должно быть отклонено`);
    }

    assert.equal(validators.fullName('Иванов Иван Иванович'), null);
    assert.equal(validators.fullName('Ёлкина Аделаида'), null);
  });

  it('телефон строго в формате 8(XXX)XXX-XX-XX', () => {
    for (const bad of ['89991234567', '+7(999)123-45-67', '8(999)123-45-6', '8 (999) 123-45-67']) {
      assert.equal(validators.phone(bad), VALIDATION_MESSAGES.phone, `телефон «${bad}»`);
    }

    assert.equal(validators.phone('8(999)123-45-67'), null);
  });

  it('email в формате электронной почты', () => {
    for (const bad of ['ivanov', 'ivanov@', '@example.ru', 'ivanov@example']) {
      assert.ok(validators.email(bad), `email «${bad}» должен быть отклонён`);
    }

    assert.equal(validators.email('ivanov@example.ru'), null);
  });

  it('на форме входа формат не проверяется — только заполненность', () => {
    assert.equal(validators.notEmpty(''), VALIDATION_MESSAGES.required);
    // Короткий логин на входе валиден: иначе форма подсказывала бы формат.
    assert.equal(validators.notEmpty('ab'), null);
  });

  it('дата начала конференции не может быть в прошлом', () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);

    assert.equal(validators.startsAt(past), VALIDATION_MESSAGES.startsAtPast);
    assert.equal(validators.startsAt(future), null);
    assert.equal(validators.startsAt(null), VALIDATION_MESSAGES.startsAtRequired);
    assert.equal(validators.startsAt('не дата'), VALIDATION_MESSAGES.startsAtInvalid);
  });

  it('оценка отзыва — целое от 1 до 5', () => {
    for (const bad of [0, 6, 2.5, null]) {
      assert.ok(validators.rating(bad), `оценка ${String(bad)} должна быть отклонена`);
    }

    for (const good of [1, 3, 5]) {
      assert.equal(validators.rating(good), null);
    }
  });
});
