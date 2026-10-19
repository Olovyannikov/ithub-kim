import type { UserDto } from '@kim/shared';
import { createEffect, createEvent, createStore, sample } from 'effector';

import { ApiError, authApi, sessionExpired } from '../../shared/api';

/**
 * Сессия пользователя.
 *
 * Признак «вошёл» — результат `GET /api/auth/me`, а не запись в localStorage:
 * токен лежит в httpOnly-cookie, браузер отправляет его сам, и читать его из
 * JavaScript нельзя по замыслу (ADR-0004, ADR-0006).
 */
export const sessionCheckRequested = createEvent();
export const logoutRequested = createEvent();

export const fetchSessionFx = createEffect<void, UserDto | null>(async () => {
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

export const loginFx = createEffect(authApi.login);
export const registerFx = createEffect(authApi.register);
export const logoutFx = createEffect(authApi.logout);

export const $user = createStore<UserDto | null>(null)
  .on(fetchSessionFx.doneData, (_, user) => user)
  .on([loginFx.doneData, registerFx.doneData], (_, user) => user)
  .reset(logoutFx.done, sessionExpired);

/** Проверка сессии ещё не завершалась — приложение не знает, вошёл ли пользователь. */
export const $sessionChecked = createStore(false).on(fetchSessionFx.finally, () => true);

export const $isAuthenticated = $user.map((user) => user !== null);
export const $isAdmin = $user.map((user) => user?.role === 'admin');

sample({ clock: sessionCheckRequested, target: fetchSessionFx });
sample({ clock: logoutRequested, target: logoutFx });
