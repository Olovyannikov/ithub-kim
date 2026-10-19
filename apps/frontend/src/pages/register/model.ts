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

  const $serverErrors = createStore(NO_SERVER_ERRORS).reset(
    formSubmitted,
    SessionModel.registerMutation.finished.success,
  );

  sample({
    clock: SessionModel.registerMutation.finished.failure,
    fn: ({ error }) => parseServerError(error),
    target: $serverErrors,
  });

  sample({ clock: formSubmitted, target: SessionModel.registerMutation.start });

  return {
    viewModel: {
      serverErrors: $serverErrors,
      pending: SessionModel.registerMutation.$pending,
      submit: formSubmitted,
      openLogin: routes.login.open,
    },
    __: { $serverErrors },
  };
});
