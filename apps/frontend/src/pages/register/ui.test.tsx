import { VALIDATION_MESSAGES } from '@kim/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../../test/render';
import { RegisterPage } from './ui';

/**
 * Проверяем ровно то, что требует Задание 2, п. 1: «Ошибки валидации должны
 * отображаться на форме». Правила — из ТЗ, Задание 1, п. 1.
 */
describe('Страница регистрации', () => {
  it('показывает формулировки из ТЗ дословно', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByRole('heading', { name: 'Регистрация' })).toBeInTheDocument();
    // Текст кнопки задан ТЗ.
    expect(screen.getByRole('button', { name: /Создать пользователя/ })).toBeInTheDocument();

    for (const label of [/Логин/, /Пароль/, /ФИО/, /Телефон/, /Электронная почта/]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('выводит на форме все ошибки правил из ТЗ', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/Логин/), 'ab');
    await user.type(screen.getByLabelText(/Пароль/), '123');
    await user.type(screen.getByLabelText(/ФИО/), 'Ivanov Ivan');
    // Поле под маской: буквы и «+7» оно не пропустит, поэтому проверяем
    // реальный случай — недописанный номер.
    await user.type(screen.getByLabelText(/Телефон/), '8999');
    await user.type(screen.getByLabelText(/Электронная почта/), 'не-почта');
    await user.click(screen.getByRole('button', { name: /Создать пользователя/ }));

    for (const message of [
      VALIDATION_MESSAGES.login,
      VALIDATION_MESSAGES.password,
      VALIDATION_MESSAGES.fullName,
      VALIDATION_MESSAGES.phone,
      VALIDATION_MESSAGES.email,
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument();
    }
  });

  it('корректные данные ошибок не вызывают', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/Логин/), 'ivanov01');
    await user.tab();

    expect(screen.queryByText(VALIDATION_MESSAGES.login)).not.toBeInTheDocument();
  });
});
