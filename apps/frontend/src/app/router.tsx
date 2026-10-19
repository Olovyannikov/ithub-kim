import { createRouteView, createRoutesView, RouterProvider } from '@effector/router-react';
import { Card, Stack, Text, Title } from '@mantine/core';

import { AdminPage } from '../pages/admin';
import { ApplicationCreatePage } from '../pages/application-create';
import { ApplicationsPage } from '../pages/applications';
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

const RoutesView = createRoutesView({
  routes: [
    createRouteView({ route: routes.login, view: LoginPage, layout: Layout }),
    createRouteView({ route: routes.register, view: RegisterPage, layout: Layout }),
    createRouteView({ route: routes.applications, view: ApplicationsPage, layout: Layout }),
    createRouteView({
      route: routes.applicationCreate,
      view: ApplicationCreatePage,
      layout: Layout,
    }),
    createRouteView({ route: routes.admin, view: AdminPage, layout: Layout }),
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
