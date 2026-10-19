import { Button } from '@mantine/core';
import { IconArrowLeft, IconListDetails } from '@tabler/icons-react';
import { useUnit } from 'effector-react';

import { SessionModel } from '../../entities/session';
import { routes } from '../../shared/routes';
import { RouteLink, StatusScreen } from '../../shared/ui';

/**
 * Страница 404.
 *
 * Куда вести с неё — зависит от того, кто пришёл: вошедшего отправляем к его
 * заявкам, гостя — на вход. Тупиковый экран без выхода хуже самой ошибки.
 */
export function NotFoundPage() {
  const isAuthenticated = useUnit(SessionModel.viewModel.isAuthenticated);

  return (
    <StatusScreen
      code="404"
      title="Страница не найдена"
      description="Похоже, адрес набран с ошибкой или страницу убрали. Проверьте ссылку или вернитесь к работе."
      actions={
        isAuthenticated ? (
          <Button
            component={RouteLink}
            to={routes.applications}
            leftSection={<IconListDetails size={18} stroke={1.8} />}
          >
            Мои заявки
          </Button>
        ) : (
          <Button
            component={RouteLink}
            to={routes.login}
            leftSection={<IconArrowLeft size={18} stroke={1.8} />}
          >
            На страницу входа
          </Button>
        )
      }
    />
  );
}
