import type { Route } from '@effector/router';
import { Link } from '@effector/router-react';
import type { ComponentPropsWithoutRef } from 'react';

interface RouteLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  to: Route<void>;
}

/**
 * Ссылка на маршрут для полиморфных компонентов Mantine.
 *
 * `Link` из роутера — дженерик-функция, и Mantine не умеет вывести её пропсы
 * через `component={Link}`: `to` теряется и TypeScript ругается. Этот адаптер
 * фиксирует тип для маршрутов без параметров — а других в приложении нет.
 *
 *   <Button component={RouteLink} to={routes.applications}>…</Button>
 */
export function RouteLink({ to, ...props }: RouteLinkProps) {
  return <Link to={to} {...props} />;
}
