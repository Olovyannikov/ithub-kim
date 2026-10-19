import type { Route } from '@effector/router';
import { Group, Text, ThemeIcon } from '@mantine/core';
import { IconBuildingBroadcastTower } from '@tabler/icons-react';

import { RouteLink } from './route-link';

/**
 * Знак портала.
 *
 * Логотипы из приложения к заданию не используем: они из сферы недвижимости
 * (дом в руке, жилые здания) и по цвету противоречат палитре заказчика —
 * обоснование в ADR-0008. Знак собран из иконки и названия в фирменном цвете.
 */
export function Logo({ route }: { route?: Route<void> }) {
  /*
    Со ссылкой знак становится настоящим `<a href>`: его можно открыть в новой
    вкладке, и скринридер объявит его ссылкой. Раньше это был Group с
    обработчиком клика — для клавиатуры и скринридера такой элемент невидим.
  */
  const linkProps = route ? ({ component: RouteLink, to: route } as const) : ({} as const);

  return (
    <Group
      {...linkProps}
      gap="xs"
      wrap="nowrap"
      c="inherit"
      style={{ cursor: route ? 'pointer' : undefined, textDecoration: 'none' }}
    >
      <ThemeIcon size={34} radius="md" variant="filled" color="brand">
        <IconBuildingBroadcastTower size={20} stroke={1.8} />
      </ThemeIcon>
      <Text fw={700} fz="lg" c="navy.6" style={{ whiteSpace: 'nowrap' }}>
        Конференции.РФ
      </Text>
    </Group>
  );
}
