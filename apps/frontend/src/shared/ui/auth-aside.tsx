import { Box, List, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

const ADVANTAGES = [
  'Аудитории, коворкинги и кинозалы по всей стране',
  'Заявка оформляется за минуту, статус виден сразу',
  'Отзывы участников о проведённых мероприятиях',
];

/**
 * Правая колонка страниц входа и регистрации.
 *
 * Фотография здесь выполняет ту же работу, что и в карточке помещения:
 * показывает, о чём портал, до того как человек что-то заполнил (ADR-0008).
 * На узких экранах колонка скрывается — макет 390×844 остаётся в одну колонку.
 */
export function AuthAside() {
  return (
    <Box
      h="100%"
      mih={420}
      style={{
        position: 'relative',
        backgroundImage: 'url(/rooms/hero-960.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        p="xl"
        h="100%"
        style={{
          // Затемнение поверх фотографии: без него белый текст нечитаем, а
          // контраст — это не вкусовщина, а доступность.
          background: 'linear-gradient(180deg, rgba(13,71,161,0.78) 0%, rgba(13,71,161,0.88) 100%)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Stack gap="md">
          <Title order={2} c="white">
            Помещение для вашей конференции
          </Title>
          <Text c="white" opacity={0.9}>
            Портал «Конференции.РФ» помогает организаторам подобрать площадку и согласовать её с
            администратором без переписки и звонков.
          </Text>
          <List
            spacing="xs"
            icon={
              <ThemeIcon size={22} radius="xl" color="white" variant="filled">
                <IconCheck
                  size={14}
                  stroke={2.4}
                  style={{ color: 'var(--mantine-color-navy-6)' }}
                />
              </ThemeIcon>
            }
          >
            {ADVANTAGES.map((item) => (
              <List.Item key={item}>
                <Text c="white" size="sm">
                  {item}
                </Text>
              </List.Item>
            ))}
          </List>
        </Stack>
      </Box>
    </Box>
  );
}
