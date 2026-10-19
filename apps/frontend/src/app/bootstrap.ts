import { historyAdapter } from '@effector/router';
import { combine, createEvent, sample } from 'effector';
import { createBrowserHistory } from 'history';

import {
  $isAdmin,
  $isAuthenticated,
  $sessionChecked,
  fetchSessionFx,
  logoutFx,
  sessionCheckRequested,
} from '../entities/session';
import { sessionExpired } from '../shared/api';
import { router, routes } from '../shared/routes';

/**
 * Запуск приложения — явное событие (ADR-0006), а не побочный эффект
 * монтирования компонента.
 */
export const appStarted = createEvent();

sample({ clock: appStarted, target: sessionCheckRequested });

const PROTECTED = [routes.home, routes.applications, routes.applicationCreate, routes.admin];

const $protectedRouteOpen = combine(
  PROTECTED.map((route) => route.$isOpened),
  (flags) => flags.some(Boolean),
);

const $guestRouteOpen = combine([routes.login.$isOpened, routes.register.$isOpened], (flags) =>
  flags.some(Boolean),
);

/**
 * Переходы, связанные с сессией.
 *
 * Важная тонкость: проверка сессии асинхронная. Если судить о доступе сразу по
 * `$isAuthenticated`, то при первой загрузке страницы пользователя с
 * действующей cookie выбросит на вход — проверка просто не успеет завершиться.
 * Поэтому защищённый роут закрывается только когда сессия **уже проверена**, и
 * отдельно — по завершении проверки.
 *
 * Клиентские переходы нужны лишь чтобы не показывать заведомо недоступный
 * экран. Настоящую защиту делает сервер (ADR-0004).
 */
const $needsLogin = combine(
  $sessionChecked,
  $isAuthenticated,
  (checked, authenticated) => checked && !authenticated,
);

sample({
  clock: PROTECTED.map((route) => route.opened),
  filter: $needsLogin,
  fn: (): void => undefined,
  target: routes.login.open,
});

sample({
  clock: fetchSessionFx.finally,
  source: combine($protectedRouteOpen, $isAuthenticated, (open, authenticated) => ({
    open,
    authenticated,
  })),
  filter: ({ open, authenticated }) => open && !authenticated,
  fn: (): void => undefined,
  target: routes.login.open,
});

/** Вошедшему пользователю на страницах входа и регистрации делать нечего. */
sample({
  clock: [routes.login.opened, routes.register.opened, fetchSessionFx.doneData],
  source: combine($guestRouteOpen, $isAuthenticated, (open, authenticated) => ({
    open,
    authenticated,
  })),
  filter: ({ open, authenticated }) => open && authenticated,
  fn: (): void => undefined,
  target: routes.applications.open,
});

/** Корень — это список заявок, отдельной страницы у него нет. */
sample({
  clock: routes.home.opened,
  fn: (): void => undefined,
  target: routes.applications.open,
});

/** Панель администратора — только для роли admin. */
sample({
  clock: routes.admin.opened,
  source: combine($sessionChecked, $isAdmin, (checked, admin) => ({ checked, admin })),
  filter: ({ checked, admin }) => checked && !admin,
  fn: (): void => undefined,
  target: routes.applications.open,
});

sample({
  clock: [sessionExpired, logoutFx.done],
  fn: (): void => undefined,
  target: routes.login.open,
});

export function startApp(): void {
  router.setHistory(historyAdapter(createBrowserHistory()));
  appStarted();
}

export { router, routes };
