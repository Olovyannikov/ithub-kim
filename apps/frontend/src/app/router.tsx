import { createRouteView, createRoutesView, RouterProvider } from '@effector/router-react';

import { LoginPage } from '../pages/login';
import { RegisterPage } from '../pages/register';
import { StubPage } from '../pages/stub';
import { router, routes } from '../shared/routes';
import { Layout } from './layout';

/** Страницы Задания 1, которые реализуются в Части 4. */
function ApplicationsPage() {
  return (
    <StubPage
      title="Мои заявки"
      part="Части 4"
      description="Просмотр ранее оставленных заявок и отзыв о качестве проведённого мероприятия."
    />
  );
}

function ApplicationCreatePage() {
  return (
    <StubPage
      title="Новая заявка"
      part="Части 4"
      description="Выбор помещения, даты начала конференции и способа оплаты."
    />
  );
}

function AdminPage() {
  return (
    <StubPage
      title="Панель администратора"
      part="Части 4"
      description="Все заявки зарегистрированных пользователей и смена статуса заявки."
    />
  );
}

function NotFoundPage() {
  return <StubPage title="Страница не найдена" part="Части 4" description="Такого адреса нет." />;
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
