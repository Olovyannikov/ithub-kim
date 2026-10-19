import { combine, createEvent, sample } from 'effector';
import { createAction } from 'effector-action';

import { SessionModel } from '../entities/session';
import { sessionExpired } from '../shared/api';
import { routes } from '../shared/routes';

/**
 * Запуск приложения — явное событие (ADR-0006), а не побочный эффект
 * монтирования компонента. Запускается через `allSettled` в `app/scope.ts`,
 * чтобы вся логика выполнялась внутри Scope.
 */
export const appStarted = createEvent();

sample({ clock: appStarted, target: SessionModel.sessionCheckRequested });

/** Страницы, на которые пускают только после входа. */
const PROTECTED = [routes.home, routes.applications, routes.applicationCreate, routes.admin];

const $protectedRouteOpen = combine(
  PROTECTED.map((route) => route.$isOpened),
  (flags) => flags.some(Boolean),
);

const $guestRouteOpen = combine([routes.login.$isOpened, routes.register.$isOpened], (flags) =>
  flags.some(Boolean),
);

/**
 * Единственное место, которое отвечает на вопрос «где сейчас должен быть
 * пользователь».
 *
 * Раньше это были семь отдельных `sample` с `combine` и `filter`, и правило
 * приходилось собирать в голове из кусков. `createAction` позволяет записать
 * решение одной функцией, не теряя декларативности: источники и цели
 * объявлены явно, а внутри — обычные условия, которые читаются сверху вниз.
 *
 * Важная тонкость: проверка сессии асинхронная. Пока она не завершилась, не
 * решаем ничего — иначе пользователя с действующей cookie выбросит на вход
 * при первой же загрузке страницы.
 *
 * Клиентские переходы нужны лишь чтобы не показывать заведомо недоступный
 * экран. Настоящую защиту делает сервер (ADR-0004).
 */
createAction({
  clock: [
    ...PROTECTED.map((route) => route.opened),
    routes.login.opened,
    routes.register.opened,
    // Проверка сессии завершилась — можно принимать решение.
    SessionModel.sessionQuery.finished.finally,
    // Вход и регистрация: пользователь уже на месте, его надо увести дальше.
    SessionModel.loginMutation.finished.success,
    SessionModel.registerMutation.finished.success,
    // Выход и протухшая сессия: наоборот, надо вернуть на вход.
    SessionModel.logoutMutation.finished.success,
    sessionExpired,
  ],
  source: {
    sessionChecked: SessionModel.$sessionChecked,
    authenticated: SessionModel.$isAuthenticated,
    admin: SessionModel.$isAdmin,
    protectedOpen: $protectedRouteOpen,
    guestOpen: $guestRouteOpen,
    homeOpen: routes.home.$isOpened,
    adminOpen: routes.admin.$isOpened,
  },
  target: {
    openLogin: routes.login.open,
    openApplications: routes.applications.open,
  },
  fn: (target, source) => {
    // Пока неизвестно, вошёл ли пользователь, никуда не переводим.
    if (!source.sessionChecked) {
      return;
    }

    if (!source.authenticated) {
      if (source.protectedOpen) {
        target.openLogin();
      }

      return;
    }

    // Вошедшему на страницах входа и регистрации делать нечего, а корень —
    // это и есть список заявок, отдельной страницы у него нет.
    if (source.guestOpen || source.homeOpen) {
      target.openApplications();

      return;
    }

    // Панель администратора — только для роли admin.
    if (source.adminOpen && !source.admin) {
      target.openApplications();
    }
  },
});
