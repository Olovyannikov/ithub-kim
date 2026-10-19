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
import type { Route } from '@effector/router';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendarPlus, IconListDetails, IconLogout, IconShieldCog } from '@tabler/icons-react';
import { useUnit } from 'effector-react';
import type { PropsWithChildren } from 'react';

import { SessionModel } from '../../entities/session';
import { routes } from '../../shared/routes';
import { Logo, RouteLink } from '../../shared/ui';

const SOCIAL = [
  { name: 'ВКонтакте', icon: '/social/vk.webp', href: 'https://vk.com' },
  { name: 'Одноклассники', icon: '/social/ok.webp', href: 'https://ok.ru' },
];

interface NavItemData {
  label: string;
  icon: typeof IconListDetails;
  route: Route<void>;
  active: boolean;
}

/**
 * Пункт навигации.
 *
 * Текущая страница ссылкой не является: вести на саму себя незачем, а щелчок
 * по ней выглядит так, будто ничего не произошло. Вместо ссылки —
 * неинтерактивный `span` с `aria-current="page"`: скринридер объявит его
 * текущей страницей, а мышь и клавиатура пройдут мимо. Подсветка — заливкой,
 * как в примерах шапок Mantine.
 */
function NavItem({
  item,
  justify,
  onNavigate,
}: {
  item: NavItemData;
  justify?: string;
  onNavigate?: () => void;
}) {
  const icon = <item.icon size={18} stroke={1.8} />;

  if (item.active) {
    return (
      <Button
        component="span"
        aria-current="page"
        variant="light"
        justify={justify}
        leftSection={icon}
        style={{ cursor: 'default' }}
      >
        {item.label}
      </Button>
    );
  }

  return (
    <Button
      component={RouteLink}
      to={item.route}
      variant="subtle"
      justify={justify}
      leftSection={icon}
      onClick={onNavigate}
    >
      {item.label}
    </Button>
  );
}

/**
 * Общий каркас страниц: шапка с навигацией, содержимое и подвал.
 *
 * Навигация на узком экране сворачивается в выдвижное меню — пользовательская
 * часть проектируется от макета 390×844 (ADR-0008).
 */
export function Layout({ children }: PropsWithChildren) {
  const { user, isAuthenticated, isAdmin, logout } = useUnit(SessionModel.viewModel);
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);

  /*
    Какой маршрут открыт сейчас. Подписки объявляются разом, а не в цикле по
    пунктам меню: хук нельзя вызывать внутри map.
  */
  const opened = useUnit({
    applications: routes.applications.$isOpened,
    applicationCreate: routes.applicationCreate.$isOpened,
    admin: routes.admin.$isOpened,
  });

  /**
   * Навигация — это ссылки, а не кнопки.
   *
   * `Link` из роутера рендерит настоящий `<a href>`: адрес виден в строке
   * состояния, страница открывается в новой вкладке средней кнопкой мыши или
   * с Ctrl, а скринридер объявляет пункт ссылкой, а не кнопкой. Обычный клик
   * роутер перехватывает сам — перезагрузки страницы не происходит.
   *
   * Кнопкой остаётся только «Выйти»: это действие, а не переход.
   */
  const navItems = [
    {
      label: 'Мои заявки',
      icon: IconListDetails,
      route: routes.applications,
      active: opened.applications,
    },
    {
      label: 'Новая заявка',
      icon: IconCalendarPlus,
      route: routes.applicationCreate,
      active: opened.applicationCreate,
    },
    ...(isAdmin
      ? [
          {
            label: 'Панель администратора',
            icon: IconShieldCog,
            route: routes.admin,
            active: opened.admin,
          },
        ]
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
            <Logo route={isAuthenticated ? routes.applications : undefined} />

            {isAuthenticated ? (
              <>
                <Group gap={4} visibleFrom="sm" wrap="nowrap">
                  {navItems.map((item) => (
                    <NavItem key={item.label} item={item} />
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
            // Меню выдвижное: после перехода его нужно закрыть руками.
            <NavItem key={item.label} item={item} justify="flex-start" onNavigate={closeMenu} />
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

      {/*
        Колонка во всю высоту экрана: содержимое растягивается, подвал
        прижимается к низу. Без этого на коротких страницах подвал вставал
        сразу под карточкой, а под ним оставалось пустое поле.

        `100dvh`, а не `100vh`: на мобильных браузерах адресная строка
        скрывается, и `vh` считается по развёрнутому окну — подвал уезжал бы
        за край.
      */}
      <AppShell.Main style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <Container size="lg" py="md" px="md" w="100%" style={{ flex: 1 }}>
          {children}
        </Container>

        <Container size="lg" px="md" pb="xl" pt="xl" w="100%">
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
