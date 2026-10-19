import { Group, Text, ThemeIcon } from '@mantine/core';
import { IconBuildingBroadcastTower } from '@tabler/icons-react';

/**
 * Знак портала.
 *
 * Логотипы из приложения к заданию не используем: они из сферы недвижимости
 * (дом в руке, жилые здания) и по цвету противоречат палитре заказчика —
 * обоснование в ADR-0008. Знак собран из иконки и названия в фирменном цвете.
 */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
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
