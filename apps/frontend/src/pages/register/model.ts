import { createEvent, createStore, sample } from 'effector';

import { SessionModel } from '../../entities/session';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';
import { createModel } from '../../shared/lib/effector';
import { routes } from '../../shared/routes';

export interface RegisterValues {
  login: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
}

/** Модель страницы регистрации — Задание 1, п. 1. */
export const RegisterPageModel = createModel(() => {
  const formSubmitted = createEvent<RegisterValues>();

  const $serverErrors = createStore(NO_SERVER_ERRORS)
    .on(SessionModel.registerFx.failData, (_, error) => parseServerError(error))
    .reset(formSubmitted, SessionModel.registerFx.done);

  sample({ clock: formSubmitted, target: SessionModel.registerFx });

  return {
    viewModel: {
      serverErrors: $serverErrors,
      pending: SessionModel.registerFx.pending,
      submit: formSubmitted,
      openLogin: routes.login.open,
    },
    __: { $serverErrors },
  };
});
