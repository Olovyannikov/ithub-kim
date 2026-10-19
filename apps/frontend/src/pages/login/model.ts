import { createEvent, createStore, sample } from 'effector';

import { loginFx } from '../../entities/session';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';

/**
 * Модель страницы входа. Логика отправки и разбор ошибок живут здесь,
 * компонент только собирает значения и показывает готовый результат
 * (ADR-0006).
 */
export interface LoginValues {
  login: string;
  password: string;
}

export const formSubmitted = createEvent<LoginValues>();

/** Ошибки сервера, уже разложенные по полям и общему сообщению. */
export const $serverErrors = createStore(NO_SERVER_ERRORS)
  .on(loginFx.failData, (_, error) => parseServerError(error))
  .reset(formSubmitted, loginFx.done);

export const $pending = loginFx.pending;

sample({ clock: formSubmitted, target: loginFx });
