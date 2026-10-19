import { createEvent, createStore, sample } from 'effector';

import { SessionModel } from '../../entities/session';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';
import { createModel } from '../../shared/lib/effector';
import { routes } from '../../shared/routes';

export interface LoginValues {
  login: string;
  password: string;
}

/**
 * Модель страницы входа. Логика отправки и разбор ошибок живут здесь,
 * компонент только собирает значения и показывает готовый результат
 * (ADR-0006).
 */
export const LoginPageModel = createModel(() => {
  const formSubmitted = createEvent<LoginValues>();

  /** Ошибки сервера, уже разложенные по полям и общему сообщению. */
  const $serverErrors = createStore(NO_SERVER_ERRORS)
    .on(SessionModel.loginFx.failData, (_, error) => parseServerError(error))
    .reset(formSubmitted, SessionModel.loginFx.done);

  sample({ clock: formSubmitted, target: SessionModel.loginFx });

  return {
    viewModel: {
      serverErrors: $serverErrors,
      pending: SessionModel.loginFx.pending,
      submit: formSubmitted,
      openRegister: routes.register.open,
    },
    __: { $serverErrors },
  };
});
