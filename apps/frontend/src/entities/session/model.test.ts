import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { allSettled, createWatch, fork } from 'effector';

import { ApiError } from '../../shared/api';
import {
  $isAdmin,
  $isAuthenticated,
  $sessionChecked,
  $user,
  fetchSessionFx,
  loginFx,
  logoutFx,
} from './model';

/**
 * Модели Effector тестируются без DOM — это и есть смысл выбранного подхода
 * «UI тупой, логика декларативная» (ADR-0006). Запросы подменяются на уровне
 * глобального fetch, поэтому проверяется вся цепочка: api-клиент, разбор
 * ошибок и переходы состояния сессии.
 */
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
    await allSettled(loginFx, { scope, params: { login: 'ivanov01', password: 'StrongPass1' } });

    assert.deepEqual(scope.getState($user), USER);
    assert.equal(scope.getState($isAuthenticated), true);
    assert.equal(scope.getState($isAdmin), false);
  });

  it('роль admin определяется по ответу сервера, а не по логину', async () => {
    stubFetch(() => json(200, { ...USER, login: 'Conf2027', role: 'admin' }));

    const scope = fork();
    await allSettled(loginFx, { scope, params: { login: 'Conf2027', password: 'Demo77' } });

    assert.equal(scope.getState($isAdmin), true);
  });

  it('401 на /auth/me — это «не вошёл», а не ошибка', async () => {
    stubFetch(() => json(401, { statusCode: 401, message: 'Необходимо войти в систему' }));

    const scope = fork();
    await allSettled(fetchSessionFx, { scope });

    assert.equal(scope.getState($user), null);
    assert.equal(scope.getState($isAuthenticated), false);
    // Проверка завершилась — приложение знает, что пользователь гость.
    assert.equal(scope.getState($sessionChecked), true);
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
      unit: loginFx.failData,
      scope,
      fn: (error) => failures.push(error),
    });

    await allSettled(loginFx, { scope, params: { login: 'ivanov01', password: 'wrong' } });
    unwatch();

    assert.equal(failures.length, 1);
    const error = failures[0];
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.fieldError('login'), 'Неверный логин или пароль');
    assert.equal(scope.getState($user), null);
  });

  it('недоступный сервер превращается в понятную ошибку, а не в падение', async () => {
    globalThis.fetch = (() => Promise.reject(new Error('network down'))) as typeof fetch;

    const scope = fork();
    const failures: unknown[] = [];
    const unwatch = createWatch({
      unit: loginFx.failData,
      scope,
      fn: (error) => failures.push(error),
    });

    await allSettled(loginFx, { scope, params: { login: 'ivanov01', password: 'StrongPass1' } });
    unwatch();

    const error = failures[0];
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 0);
    assert.match(error.message, /Сервер недоступен/);
  });

  it('выход очищает сессию', async () => {
    stubFetch((url) =>
      url.endsWith('/auth/logout') ? new Response(null, { status: 204 }) : json(200, USER),
    );

    const scope = fork();
    await allSettled(loginFx, { scope, params: { login: 'ivanov01', password: 'StrongPass1' } });
    assert.equal(scope.getState($isAuthenticated), true);

    await allSettled(logoutFx, { scope });

    assert.equal(scope.getState($user), null);
    assert.equal(scope.getState($isAuthenticated), false);
  });
});
