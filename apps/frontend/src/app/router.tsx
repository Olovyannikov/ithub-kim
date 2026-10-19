import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  RouterProvider,
} from '@effector/router-react';
import { Card, Center, Loader, Stack, Text, Title } from '@mantine/core';

import { LoginPage } from '../pages/login';
import { RegisterPage } from '../pages/register';
import { router, routes } from '../shared/routes';
import { Layout } from './layout';

function NotFoundPage() {
  return (
    <Card withBorder padding="xl" bg="white">
      <Stack gap="sm">
        <Title order={2}>Страница не найдена</Title>
        <Text c="dimmed">Проверьте адрес или вернитесь к своим заявкам.</Text>
      </Stack>
    </Card>
  );
}

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
 * Страницы экспортируются именованно, поэтому в `import()` подставляем
 * нужный компонент под ключ `default` — именно его ждёт `React.lazy`.
 */
const RoutesView = createRoutesView({
  routes: [
    createRouteView({ route: routes.login, view: LoginPage, layout: Layout }),
    createRouteView({ route: routes.register, view: RegisterPage, layout: Layout }),
    createLazyRouteView({
      route: routes.applications,
      view: () => import('../pages/applications').then((m) => ({ default: m.ApplicationsPage })),
      layout: Layout,
      fallback: RouteFallback,
    }),
    createLazyRouteView({
      route: routes.applicationCreate,
      view: () =>
        import('../pages/application-create').then((m) => ({
          default: m.ApplicationCreatePage,
        })),
      layout: Layout,
      fallback: RouteFallback,
    }),
    createLazyRouteView({
      route: routes.admin,
      view: () => import('../pages/admin').then((m) => ({ default: m.AdminPage })),
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
