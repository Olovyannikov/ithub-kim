import { useEffect } from 'react';
import { Alert, Badge, Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { useUnit } from 'effector-react';
import { PAYMENT_METHODS, ROOM_KINDS } from '@kim/shared';

import { $error, $health, $pending, appStarted, fetchHealthFx } from './health.model';

export function App() {
  const [health, error, pending, start, refresh] = useUnit([
    $health,
    $error,
    $pending,
    appStarted,
    fetchHealthFx,
  ]);

  useEffect(() => {
    start();
  }, [start]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1}>Конференции.РФ</Title>
          <Text c="dimmed">
            Каркас проекта. Страницы приложения появятся в Части 4 плана — см. README.
          </Text>
        </Stack>

        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Title order={3}>Проверка связки</Title>

            {error ? (
              <Alert color="red" title="Бэкенд недоступен">
                {error}. Запустите API: <code>pnpm dev:api</code>
              </Alert>
            ) : (
              <Text>
                Статус API:{' '}
                <Badge color={health ? 'green' : 'gray'}>{health?.status ?? 'нет данных'}</Badge>
              </Text>
            )}

            <Button onClick={() => refresh()} loading={pending} variant="light" w="fit-content">
              Проверить снова
            </Button>
          </Stack>
        </Card>

        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Title order={3}>Домен из @kim/shared</Title>
            <Group gap="xs">
              {ROOM_KINDS.map((kind) => (
                <Badge key={kind} variant="outline">
                  {kind}
                </Badge>
              ))}
            </Group>
            <Group gap="xs">
              {PAYMENT_METHODS.map((method) => (
                <Badge key={method} variant="light" color="teal">
                  {method}
                </Badge>
              ))}
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
