import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../../test/render';
import { ErrorBoundary } from './error-boundary';

function Explodes(): never {
  throw new Error('Помещение не найдено в справочнике');
}

/**
 * React печатает в консоль каждую пойманную ошибку — в выводе тестов это шум,
 * из-за которого не видно настоящих проблем.
 */
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Граница ошибок', () => {
  it('пропускает содержимое, пока всё в порядке', () => {
    renderWithProviders(
      <ErrorBoundary>
        <p>Мои заявки</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Мои заявки')).toBeInTheDocument();
  });

  it('вместо пустого экрана показывает 500 и выход из него', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Explodes />
      </ErrorBoundary>,
    );

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Что-то сломалось' })).toBeInTheDocument();
    // Тупиковый экран без действия хуже самой ошибки.
    expect(screen.getByRole('button', { name: /Обновить страницу/ })).toBeInTheDocument();
  });

  it('текст ошибки спрятан, но доступен тому, кто будет разбираться', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ErrorBoundary>
        <Explodes />
      </ErrorBoundary>,
    );

    expect(screen.queryByText(/Помещение не найдено/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Подробности' }));

    expect(screen.getByText(/Помещение не найдено/)).toBeInTheDocument();
  });
});
