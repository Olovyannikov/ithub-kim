import type { UserDto } from '@kim/shared';
import { createMutation, createQuery } from '@farfetched/core';
import { createEvent, createStore, sample } from 'effector';

import { ApiError, authApi, sessionExpired } from '../../shared/api';
import { createModel } from '../../shared/lib/effector';

/**
 * Сессия пользователя.
 *
 * Признак «вошёл» — результат `GET /api/auth/me`, а не запись в localStorage:
 * токен лежит в httpOnly-cookie, браузер отправляет его сам, и читать его из
 * JavaScript нельзя по замыслу (ADR-0004, ADR-0006).
 *
 * Чтение описано запросом, изменения — мутациями (ADR-0011): во всех моделях
 * обращения к серверу выглядят одинаково.
 */
export const SessionModel = createModel(() => {
  const sessionCheckRequested = createEvent();
  const logoutRequested = createEvent();

  const sessionQuery = createQuery({
    name: 'session',
    handler: async (): Promise<UserDto | null> => {
      try {
        return await authApi.me();
      } catch (error) {
        // 401 на этом эндпоинте — нормальный ответ «не вошёл», а не ошибка.
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }

        throw error;
      }
    },
  });

  const loginMutation = createMutation({ name: 'login', handler: authApi.login });
  const registerMutation = createMutation({ name: 'register', handler: authApi.register });
  const logoutMutation = createMutation({ name: 'logout', handler: authApi.logout });

  const $user = createStore<UserDto | null>(null).reset(
    logoutMutation.finished.success,
    sessionExpired,
  );

  /** Проверка сессии ещё не завершалась — приложение не знает, вошёл ли пользователь. */
  const $sessionChecked = createStore(false);

  sample({
    clock: [
      sessionQuery.finished.success,
      loginMutation.finished.success,
      registerMutation.finished.success,
    ],
    fn: ({ result }) => result,
    target: $user,
  });

  sample({ clock: sessionQuery.finished.finally, fn: () => true, target: $sessionChecked });

  const $isAuthenticated = $user.map((user) => user !== null);
  const $isAdmin = $user.map((user) => user?.role === 'admin');

  sample({ clock: sessionCheckRequested, target: sessionQuery.start });
  sample({ clock: logoutRequested, target: logoutMutation.start });

  return {
    viewModel: {
      user: $user,
      isAuthenticated: $isAuthenticated,
      isAdmin: $isAdmin,
      logout: logoutRequested,
    },
    // Этим пользуются запуск приложения и модели страниц входа и регистрации.
    $user,
    $isAuthenticated,
    $isAdmin,
    $sessionChecked,
    sessionCheckRequested,
    sessionQuery,
    loginMutation,
    registerMutation,
    logoutMutation,
  };
});
