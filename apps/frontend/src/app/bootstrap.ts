import { combine, createEvent, sample } from 'effector';

import {
  $isAdmin,
  $isAuthenticated,
  $sessionChecked,
  fetchSessionFx,
  loginFx,
  logoutFx,
  registerFx,
  sessionCheckRequested,
} from '../entities/session';
import { sessionExpired } from '../shared/api';
import { routes } from '../shared/routes';

/**
 * Запуск приложения — явное событие (ADR-0006), а не побочный эффект
 * монтирования компонента. Запускается через `allSettled` в `app/scope.ts`,
 * чтобы вся логика выполнялась внутри Scope.
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

/**
 * После успешного входа или регистрации — на свои заявки.
 *
 * Отдельным переходом, а не через проверку «гость на странице входа»: раньше
 * этого перехода не было, и пользователь после успешного входа оставался на
 * форме. Нашлось сквозной проверкой в браузере — ни запросы curl, ни модульные
 * тесты такого не видят.
 */
sample({
  clock: [loginFx.doneData, registerFx.doneData],
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
