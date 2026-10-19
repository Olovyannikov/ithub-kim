import {
  ActionIcon,
  AppShell,
  Anchor,
  Badge,
  Burger,
  Button,
  Container,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendarPlus, IconListDetails, IconLogout, IconShieldCog } from '@tabler/icons-react';
import { useUnit } from 'effector-react';
import type { ReactNode } from 'react';

import { $isAdmin, $isAuthenticated, $user, logoutRequested } from '../../entities/session';
import { routes } from '../../shared/routes';
import { Logo } from '../../shared/ui';

const SOCIAL = [
  { name: 'ВКонтакте', icon: '/social/vk.webp', href: 'https://vk.com' },
  { name: 'Одноклассники', icon: '/social/ok.webp', href: 'https://ok.ru' },
];

/**
 * Общий каркас страниц: шапка с навигацией, содержимое и подвал.
 *
 * Навигация на узком экране сворачивается в выдвижное меню — пользовательская
 * часть проектируется от макета 390×844 (ADR-0008).
 */
export function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAdmin, logout, openApplications, openCreate, openAdmin } =
    useUnit({
      user: $user,
      isAuthenticated: $isAuthenticated,
      isAdmin: $isAdmin,
      logout: logoutRequested,
      openApplications: routes.applications.open,
      openCreate: routes.applicationCreate.open,
      openAdmin: routes.admin.open,
    });
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);

  const navigate = (open: () => void) => () => {
    closeMenu();
    open();
  };

  const navItems = [
    { label: 'Мои заявки', icon: IconListDetails, action: navigate(openApplications) },
    { label: 'Новая заявка', icon: IconCalendarPlus, action: navigate(openCreate) },
    ...(isAdmin
      ? [{ label: 'Панель администратора', icon: IconShieldCog, action: navigate(openAdmin) }]
      : []),
  ];

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { desktop: true, mobile: !menuOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="lg" h="100%" px="md">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Logo onClick={isAuthenticated ? navigate(openApplications) : undefined} />

            {isAuthenticated ? (
              <>
                <Group gap={4} visibleFrom="sm" wrap="nowrap">
                  {navItems.map((item) => (
                    <Button
                      key={item.label}
                      variant="subtle"
                      leftSection={<item.icon size={18} stroke={1.8} />}
                      onClick={item.action}
                    >
                      {item.label}
                    </Button>
                  ))}
                  <Divider orientation="vertical" mx="xs" />
                  <Stack gap={0} align="flex-end">
                    <Text size="sm" fw={500} maw={200} truncate>
                      {user?.fullName}
                    </Text>
                    {isAdmin ? (
                      <Badge size="xs" color="navy" variant="light">
                        Администратор
                      </Badge>
                    ) : null}
                  </Stack>
                  <ActionIcon variant="light" size="lg" aria-label="Выйти" onClick={() => logout()}>
                    <IconLogout size={18} stroke={1.8} />
                  </ActionIcon>
                </Group>
                <Burger
                  opened={menuOpened}
                  onClick={toggleMenu}
                  hiddenFrom="sm"
                  aria-label="Меню"
                />
              </>
            ) : null}
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md" hiddenFrom="sm">
        <Stack gap="xs">
          <Stack gap={0} pb="sm">
            <Text size="sm" fw={500}>
              {user?.fullName}
            </Text>
            {isAdmin ? (
              <Badge size="xs" color="navy" variant="light" w="fit-content">
                Администратор
              </Badge>
            ) : null}
          </Stack>
          <Divider />
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="subtle"
              justify="flex-start"
              leftSection={<item.icon size={18} stroke={1.8} />}
              onClick={item.action}
            >
              {item.label}
            </Button>
          ))}
          <Divider />
          <Button
            variant="light"
            justify="flex-start"
            leftSection={<IconLogout size={18} stroke={1.8} />}
            onClick={() => logout()}
          >
            Выйти
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg" py="md" px="md">
          {children}
        </Container>

        <Container size="lg" px="md" pb="xl" pt="xl">
          <Divider mb="md" />
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <Stack gap={4}>
              <Text size="sm" fw={500}>
                Портал «Конференции.РФ»
              </Text>
              <Text size="xs" c="dimmed">
                Бронирование помещений для Всероссийских конференций
              </Text>
            </Stack>
            <Group gap="xs">
              {SOCIAL.map((item) => (
                <Anchor
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={item.name}
                >
                  <img src={item.icon} alt={item.name} width={28} height={28} loading="lazy" />
                </Anchor>
              ))}
            </Group>
          </Group>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
