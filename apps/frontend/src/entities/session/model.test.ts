import { allSettled, createWatch, fork } from 'effector';
import { afterEach, describe, expect, it } from 'vitest';

import { ApiError } from '../../shared/api';
import { SessionModel } from './model';

/**
 * Модели Effector тестируются без DOM — это и есть смысл выбранного подхода
 * «UI тупой, логика декларативная» (ADR-0006). Запросы подменяются на уровне
 * глобального fetch, поэтому проверяется вся цепочка: api-клиент, разбор
 * ошибок и переходы состояния сессии.
 */
const {
  $user,
  $isAuthenticated,
  $isAdmin,
  $sessionChecked,
  sessionQuery,
  loginMutation,
  logoutMutation,
} = SessionModel;

const realFetch = globalThis.fetch;

function stubFetch(handler: (url: string, init?: RequestInit) => Response): void {
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init))) as typeof fetch;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const USER = {
  id: 1,
  login: 'ivanov01',
  fullName: 'Иванов Иван Иванович',
  phone: '8(999)123-45-67',
  email: 'ivanov@example.ru',
  role: 'user',
};

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('модель сессии', () => {
  it('после успешного входа пользователь попадает в стор', async () => {
    stubFetch(() => json(200, USER));

    const scope = fork();
    await allSettled(loginMutation.start, {
      scope,
      params: { login: 'ivanov01', password: 'StrongPass1' },
    });

    expect(scope.getState($user)).toEqual(USER);
    expect(scope.getState($isAuthenticated)).toBe(true);
    expect(scope.getState($isAdmin)).toBe(false);
  });

  it('роль admin определяется по ответу сервера, а не по логину', async () => {
    stubFetch(() => json(200, { ...USER, login: 'Conf2027', role: 'admin' }));

    const scope = fork();
    await allSettled(loginMutation.start, {
      scope,
      params: { login: 'Conf2027', password: 'Demo77' },
    });

    expect(scope.getState($isAdmin)).toBe(true);
  });

  it('401 на /auth/me — это «не вошёл», а не ошибка', async () => {
    stubFetch(() => json(401, { statusCode: 401, message: 'Необходимо войти в систему' }));

    const scope = fork();
    await allSettled(sessionQuery.start, { scope, params: undefined });

    expect(scope.getState($user)).toBe(null);
    expect(scope.getState($isAuthenticated)).toBe(false);
    // Проверка завершилась — приложение знает, что пользователь гость.
    expect(scope.getState($sessionChecked)).toBe(true);
  });

  it('ошибки с полями разбираются в ApiError и доезжают до failData', async () => {
    stubFetch(() =>
      json(401, {
        statusCode: 401,
        message: 'Неверный логин или пароль',
        errors: { login: 'Неверный логин или пароль' },
      }),
    );

    const scope = fork();
    const failures: unknown[] = [];
    // createWatch, а не .watch: подписка привязана к конкретному scope,
    // иначе тест реагировал бы на события из других scope.
    const unwatch = createWatch({
      unit: loginMutation.finished.failure,
      scope,
      fn: ({ error }) => failures.push(error),
    });

    await allSettled(loginMutation.start, {
      scope,
      params: { login: 'ivanov01', password: 'wrong' },
    });
    unwatch();

    expect(failures.length).toBe(1);
    const error = failures[0];
    expect(error).toBeInstanceOf(ApiError);
    // Приведение нужно, потому что expect не сужает тип так, как это делал
    // assert из node:test.
    const apiError = error as ApiError;
    expect(apiError.status).toBe(401);
    expect(apiError.fieldError('login')).toBe('Неверный логин или пароль');
    expect(scope.getState($user)).toBe(null);
  });

  it('недоступный сервер превращается в понятную ошибку, а не в падение', async () => {
    globalThis.fetch = (() => Promise.reject(new Error('network down'))) as typeof fetch;

    const scope = fork();
    const failures: unknown[] = [];
    const unwatch = createWatch({
      unit: loginMutation.finished.failure,
      scope,
      fn: ({ error }) => failures.push(error),
    });

    await allSettled(loginMutation.start, {
      scope,
      params: { login: 'ivanov01', password: 'StrongPass1' },
    });
    unwatch();

    const error = failures[0];
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(0);
    expect(apiError.message).toMatch(/Сервер недоступен/);
  });

  it('выход очищает сессию', async () => {
    stubFetch((url) =>
      url.endsWith('/auth/logout') ? new Response(null, { status: 204 }) : json(200, USER),
    );

    const scope = fork();
    await allSettled(loginMutation.start, {
      scope,
      params: { login: 'ivanov01', password: 'StrongPass1' },
    });
    expect(scope.getState($isAuthenticated)).toBe(true);

    await allSettled(logoutMutation.start, { scope, params: undefined });

    expect(scope.getState($user)).toBe(null);
    expect(scope.getState($isAuthenticated)).toBe(false);
  });
});
