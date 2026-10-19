import { AppShell, Badge, Burger, Button, Container, Group, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useUnit } from 'effector-react';
import type { ReactNode } from 'react';

import { $isAdmin, $isAuthenticated, $user, logoutRequested } from '../../entities/session';
import { routes } from '../../shared/routes';

/**
 * Общий каркас страниц: шапка с навигацией и контейнер контента.
 *
 * Композиция и визуальная проработка — Часть 5 (ADR-0008). Здесь только
 * структура, чтобы страницы не занимались навигацией.
 */
export function Layout({ children }: { children: ReactNode }) {
  // События роутера тоже проходят через useUnit: прямой вызов `route.open()`
  // в компоненте обходит привязку к scope — это ловит eslint-plugin-effector.
  const [user, isAuthenticated, isAdmin, logout, openApplications, openCreate, openAdmin] = useUnit(
    [
      $user,
      $isAuthenticated,
      $isAdmin,
      logoutRequested,
      routes.applications.open,
      routes.applicationCreate.open,
      routes.admin.open,
    ],
  );
  const [menuOpened, { toggle: toggleMenu }] = useDisclosure(false);

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Title
                order={3}
                c="navy.6"
                style={{ cursor: 'pointer' }}
                onClick={() => openApplications()}
              >
                Конференции.РФ
              </Title>
            </Group>

            {isAuthenticated ? (
              <>
                <Group gap="xs" visibleFrom="sm" wrap="nowrap">
                  <Button variant="subtle" onClick={() => openApplications()}>
                    Мои заявки
                  </Button>
                  <Button variant="subtle" onClick={() => openCreate()}>
                    Новая заявка
                  </Button>
                  {isAdmin ? (
                    <Button variant="subtle" onClick={() => openAdmin()}>
                      Панель администратора
                    </Button>
                  ) : null}
                  <Text size="sm" c="dimmed" maw={220} truncate>
                    {user?.fullName}
                  </Text>
                  {/*
                    Здесь подпись роли, а не логин: Badge в Mantine по
                    умолчанию приводит текст к верхнему регистру, а логины у
                    нас регистрозависимы — `Conf2027` отрисовался бы как
                    `CONF2027` и перестал соответствовать ТЗ.
                  */}
                  {isAdmin ? <Badge color="navy">Администратор</Badge> : null}
                  <Button variant="light" onClick={() => logout()}>
                    Выйти
                  </Button>
                </Group>
                <Burger opened={menuOpened} onClick={toggleMenu} hiddenFrom="sm" />
              </>
            ) : null}
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" py="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
