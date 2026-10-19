import { Alert, Card, Stack, Text, Title } from '@mantine/core';

interface StubPageProps {
  title: string;
  part: string;
  description: string;
}

/**
 * Заглушка для страниц, которые реализуются в Части 4 плана.
 *
 * Нужна, чтобы роутинг и защита маршрутов проверялись целиком уже сейчас,
 * а не после того, как будут написаны все экраны.
 */
export function StubPage({ title, part, description }: StubPageProps) {
  return (
    <Card withBorder padding="xl" bg="white">
      <Stack gap="sm">
        <Title order={2}>{title}</Title>
        <Text c="dimmed">{description}</Text>
        <Alert color="blue" variant="light" title="Страница в работе">
          Реализуется в {part} плана — см. README.
        </Alert>
      </Stack>
    </Card>
  );
}
