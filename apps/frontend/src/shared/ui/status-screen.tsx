import { Card, Group, Stack, Text, Title } from '@mantine/core';
import type { PropsWithChildren, ReactNode } from 'react';

interface StatusScreenProps {
  /** Код состояния крупно — по нему человек поймёт, что случилось, ещё до текста. */
  code: string;
  title: string;
  description: ReactNode;
  /** Кнопки действий: уводить с тупикового экрана обязательно. */
  actions?: ReactNode;
}

/**
 * Экран состояния: «не найдено», «что-то сломалось» и прочие тупики.
 *
 * Общий компонент, потому что такие экраны должны выглядеть одинаково, а
 * различаться только текстом. Код состояния набран крупно и приглушённо: он
 * нужен тому, кто будет разбираться, но не должен кричать на пользователя,
 * который просто ошибся адресом.
 */
export function StatusScreen({
  code,
  title,
  description,
  actions,
  children,
}: PropsWithChildren<StatusScreenProps>) {
  return (
    <Card withBorder padding="xl" radius="md" bg="white" maw={640} mx="auto">
      <Stack gap="md" align="center" ta="center">
        <Text fz={72} fw={700} lh={1} c="brand.1" aria-hidden>
          {code}
        </Text>

        <Stack gap={6}>
          <Title order={2}>{title}</Title>
          <Text c="dimmed">{description}</Text>
        </Stack>

        {children}

        {actions ? (
          <Group justify="center" gap="sm" mt="xs">
            {actions}
          </Group>
        ) : null}
      </Stack>
    </Card>
  );
}
