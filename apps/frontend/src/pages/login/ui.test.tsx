import { VALIDATION_MESSAGES } from '@kim/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fork } from 'effector';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../../test/render';
import { $serverErrors } from './model';
import { LoginPage } from './ui';

describe('Страница входа', () => {
  it('показывает формулировки из ТЗ дословно', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Логин/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Пароль/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Войти/ })).toBeInTheDocument();
    // Текст ссылки задан Заданием 1, п. 2 и должен совпадать посимвольно.
    expect(
      screen.getByRole('button', { name: 'Еще не зарегистрированы? Регистрация' }),
    ).toBeInTheDocument();
  });

  it('не отправляет пустую форму и показывает ошибки на ней', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /Войти/ }));

    expect(await screen.findAllByText(VALIDATION_MESSAGES.required)).toHaveLength(2);
  });

  it('ошибку сервера показывает под нужным полем', () => {
    // Состояние кладём прямо в scope: так проверяется связка модели и формы
    // без обращения к сети (ADR-0006).
    const scope = fork({
      values: [
        [$serverErrors, { fields: { login: VALIDATION_MESSAGES.credentials }, message: null }],
      ],
    });

    renderWithProviders(<LoginPage />, { scope });

    expect(screen.getByText(VALIDATION_MESSAGES.credentials)).toBeInTheDocument();
  });

  it('сообщение без привязки к полю выводит общим блоком', () => {
    const scope = fork({
      values: [[$serverErrors, { fields: {}, message: 'Сервер недоступен' }]],
    });

    renderWithProviders(<LoginPage />, { scope });

    expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
  });
});
