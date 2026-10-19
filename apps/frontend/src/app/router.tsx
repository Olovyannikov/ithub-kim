import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  RouterProvider,
} from '@effector/router-react';
import { Center, Loader } from '@mantine/core';

import { loadAdminPage } from '../pages/admin';
import { loadApplicationCreatePage } from '../pages/application-create';
import { loadApplicationsPage } from '../pages/applications';
import { LoginPage } from '../pages/login';
import { NotFoundPage } from '../pages/not-found';
import { RegisterPage } from '../pages/register';
import { router, routes } from '../shared/routes';
import { Layout } from './layout';

/** Пока подгружается код страницы, показываем тот же загрузчик, что и при загрузке данных. */
function RouteFallback() {
  return (
    <Center py="xl">
      <Loader />
    </Center>
  );
}

/**
 * Страницы входа и регистрации загружаются сразу: это вход в приложение, и
 * откладывать их значит показывать загрузчик вместо первого экрана.
 *
 * Внутренние страницы вынесены в отдельные части сборки (Задание 3,
 * оптимизация производительности): пользователь, который только вошёл, не
 * тянет код панели администратора, а посетитель страницы входа — вообще
 * ничего лишнего.
 *
 * Загрузчики разметки объявлены внутри самих срезов, поэтому роутер не лезет
 * в их внутренние файлы — публичный API остаётся единственной точкой входа.
 */
const RoutesView = createRoutesView({
  routes: [
    createRouteView({ route: routes.login, view: LoginPage, layout: Layout }),
    createRouteView({ route: routes.register, view: RegisterPage, layout: Layout }),
    createLazyRouteView({
      route: routes.applications,
      view: loadApplicationsPage,
      layout: Layout,
      fallback: RouteFallback,
    }),
    createLazyRouteView({
      route: routes.applicationCreate,
      view: loadApplicationCreatePage,
      layout: Layout,
      fallback: RouteFallback,
    }),
    createLazyRouteView({
      route: routes.admin,
      view: loadAdminPage,
      layout: Layout,
      fallback: RouteFallback,
    }),
  ],
  otherwise: () => (
    <Layout>
      <NotFoundPage />
    </Layout>
  ),
});

export function AppRouter() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}
