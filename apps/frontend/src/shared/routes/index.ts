import { createRoute, createRouter } from '@effector/router';

/**
 * Роуты как единицы Effector (ADR-0006): открытие роута — событие, на которое
 * модели страниц подписываются через `sample`. Поэтому загрузка данных не
 * зависит от жизненного цикла React.
 *
 * Путь задаётся здесь и больше нигде: ссылок вида `href="/admin"` в коде быть
 * не должно, переход — только `routes.admin.open()`.
 */
export const routes = {
  /** Задание 1, п. 2: авторизация. */
  login: createRoute({ path: '/login' }),
  /** Задание 1, п. 1: регистрация. */
  register: createRoute({ path: '/register' }),
  /** Задание 1, п. 3: просмотр своих заявок. */
  applications: createRoute({ path: '/applications' }),
  /** Задание 1, п. 4: формирование заявки. */
  applicationCreate: createRoute({ path: '/applications/new' }),
  /** Задание 1, п. 5: панель администратора. */
  admin: createRoute({ path: '/admin' }),
  /** Корень ведёт на список заявок — после входа это основная страница. */
  home: createRoute({ path: '/' }),
};

export const router = createRouter({
  // Порядок важен: более конкретный путь объявляется раньше общего.
  routes: [
    routes.login,
    routes.register,
    routes.applicationCreate,
    routes.applications,
    routes.admin,
    routes.home,
  ],
});
