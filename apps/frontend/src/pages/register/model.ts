import { createEvent, createStore, sample } from 'effector';

import { registerFx } from '../../entities/session';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';

/** Модель страницы регистрации — Задание 1, п. 1. */
export interface RegisterValues {
  login: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
}

export const formSubmitted = createEvent<RegisterValues>();

export const $serverErrors = createStore(NO_SERVER_ERRORS)
  .on(registerFx.failData, (_, error) => parseServerError(error))
  .reset(formSubmitted, registerFx.done);

export const $pending = registerFx.pending;

sample({ clock: formSubmitted, target: registerFx });
