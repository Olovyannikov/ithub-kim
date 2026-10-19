import type { UserDto } from '@kim/shared';
import { createEffect, createEvent, createStore, sample } from 'effector';

import { ApiError, authApi, sessionExpired } from '../../shared/api';
import { createModel } from '../../shared/lib/effector';

/**
 * Сессия пользователя.
 *
 * Признак «вошёл» — результат `GET /api/auth/me`, а не запись в localStorage:
 * токен лежит в httpOnly-cookie, браузер отправляет его сам, и читать его из
 * JavaScript нельзя по замыслу (ADR-0004, ADR-0006).
 */
export const SessionModel = createModel(() => {
  const sessionCheckRequested = createEvent();
  const logoutRequested = createEvent();

  const fetchSessionFx = createEffect<void, UserDto | null>(async () => {
    try {
      return await authApi.me();
    } catch (error) {
      // 401 на этом эндпоинте — нормальный ответ «не вошёл».
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }

      throw error;
    }
  });

  const loginFx = createEffect(authApi.login);
  const registerFx = createEffect(authApi.register);
  const logoutFx = createEffect(authApi.logout);

  const $user = createStore<UserDto | null>(null)
    .on(fetchSessionFx.doneData, (_, user) => user)
    .on([loginFx.doneData, registerFx.doneData], (_, user) => user)
    .reset(logoutFx.done, sessionExpired);

  /** Проверка сессии ещё не завершалась — приложение не знает, вошёл ли пользователь. */
  const $sessionChecked = createStore(false).on(fetchSessionFx.finally, () => true);

  const $isAuthenticated = $user.map((user) => user !== null);
  const $isAdmin = $user.map((user) => user?.role === 'admin');

  sample({ clock: sessionCheckRequested, target: fetchSessionFx });
  sample({ clock: logoutRequested, target: logoutFx });

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
    fetchSessionFx,
    loginFx,
    registerFx,
    logoutFx,
  };
});
