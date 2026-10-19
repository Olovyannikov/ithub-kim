import type { ApplicationDto } from '@kim/shared';
import { Card, Grid, Group, Stack, Text, Title } from '@mantine/core';
import {
  IconCalendarEvent,
  IconCreditCard,
  IconMail,
  IconPhone,
  IconStarFilled,
  IconUser,
} from '@tabler/icons-react';
import type { PropsWithChildren, ReactNode } from 'react';

import { formatDateTime } from '../../../shared/lib';
import { RoomImage } from '../../../shared/ui';
import { StatusBadge } from './status-badge';

interface ApplicationCardProps {
  application: ApplicationDto;
  /** Карточка реагирует на наведение, если по ней есть действие. */
  interactive?: boolean;
  /** Действия над заявкой: отзыв у пользователя, смена статуса у администратора. */
  actions?: ReactNode;
  /** Показывать автора — нужно только в панели администратора. */
  withAuthor?: boolean;
  /** Первая карточка в списке грузит изображение сразу. */
  eagerImage?: boolean;
}

function Field({
  icon: Icon,
  label,
  children,
}: PropsWithChildren<{ icon: typeof IconUser; label: string }>) {
  return (
    <Group gap={8} wrap="nowrap" align="flex-start">
      <Icon size={16} stroke={1.8} style={{ marginTop: 2, flexShrink: 0, opacity: 0.55 }} />
      <Text size="sm">
        <Text span c="dimmed">
          {label}:{' '}
        </Text>
        {children}
      </Text>
    </Group>
  );
}

/**
 * Карточка заявки — Задание 2, п. 5 требует «отображение карточек заявок».
 *
 * Фотография помещения здесь не украшение: по анализу предметной области
 * выбор делается глазами, поэтому изображение — часть карточки (ADR-0008).
 * Общая для своих заявок и для панели администратора: разница только в
 * действиях и в показе автора.
 */
export function ApplicationCard({
  application,
  actions,
  withAuthor,
  eagerImage,
  interactive,
}: ApplicationCardProps) {
  return (
    <Card
      withBorder
      padding="lg"
      bg="white"
      radius="md"
      // Появление объясняет, что данные приехали; отклик на наведение —
      // что с карточкой можно работать (ADR-0009).
      className={['kim-appear', interactive ? 'kim-interactive' : ''].filter(Boolean).join(' ')}
    >
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, sm: 5, md: 4 }}>
          <RoomImage
            slug={application.room.imageUrl}
            alt={application.room.name}
            sizes="(max-width: 48em) 100vw, 360px"
            eager={eagerImage}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 7, md: 8 }}>
          <Stack gap="sm" h="100%">
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
              <Stack gap={2}>
                <Title order={3}>{application.room.name}</Title>
                <Text size="sm" c="dimmed">
                  {application.room.kind}
                  {application.room.capacity ? ` · до ${application.room.capacity} человек` : ''}
                </Text>
              </Stack>
              <StatusBadge status={application.status} />
            </Group>

            <Stack gap={6}>
              <Field icon={IconCalendarEvent} label="Начало конференции">
                {formatDateTime(application.startsAt)}
              </Field>
              <Field icon={IconCreditCard} label="Способ оплаты">
                {application.paymentMethod}
              </Field>
            </Stack>

            {withAuthor && application.author ? (
              <Stack gap={6}>
                <Field icon={IconUser} label="Заявитель">
                  {application.author.fullName} ({application.author.login})
                </Field>
                <Group gap="md" wrap="wrap">
                  <Field icon={IconPhone} label="Телефон">
                    {application.author.phone}
                  </Field>
                  <Field icon={IconMail} label="Почта">
                    {application.author.email}
                  </Field>
                </Group>
              </Stack>
            ) : null}

            {application.review ? (
              <Card
                withBorder
                padding="sm"
                radius="sm"
                bg="brand.0"
                style={{ borderColor: 'var(--mantine-color-brand-2)' }}
              >
                <Stack gap={4}>
                  <Group gap={6}>
                    <IconStarFilled size={14} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                    <Text size="sm" fw={700}>
                      Отзыв
                    </Text>
                    <Text size="sm" c="dimmed">
                      оценка {application.review.rating} из 5
                    </Text>
                  </Group>
                  <Text size="sm">{application.review.text}</Text>
                </Stack>
              </Card>
            ) : null}

            <Group gap="sm" mt="auto" pt={4}>
              <Text size="xs" c="dimmed">
                Заявка подана {formatDateTime(application.createdAt)}
              </Text>
            </Group>

            {actions ? <Group gap="sm">{actions}</Group> : null}
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  );
}
