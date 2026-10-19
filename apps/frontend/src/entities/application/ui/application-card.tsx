import type { ApplicationDto } from '@kim/shared';
import { Card, Group, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

import { formatDateTime } from '../../../shared/lib';
import { StatusBadge } from './status-badge';

interface ApplicationCardProps {
  application: ApplicationDto;
  /** Действия над заявкой: отзыв у пользователя, смена статуса у администратора. */
  actions?: ReactNode;
  /** Показывать автора — нужно только в панели администратора. */
  withAuthor?: boolean;
}

/**
 * Карточка заявки — Задание 2, п. 5 требует «отображение карточек заявок».
 *
 * Общая для своих заявок и для панели администратора: разница только в
 * действиях и в показе автора.
 */
export function ApplicationCard({ application, actions, withAuthor }: ApplicationCardProps) {
  return (
    <Card withBorder padding="lg" bg="white">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={2}>
            <Title order={3}>{application.room.name}</Title>
            <Text size="sm" c="dimmed">
              {application.room.kind}
              {application.room.capacity ? ` · до ${application.room.capacity} человек` : ''}
            </Text>
          </Stack>
          <StatusBadge status={application.status} />
        </Group>

        <Stack gap={2}>
          <Text size="sm">
            <Text span c="dimmed">
              Начало конференции:{' '}
            </Text>
            {formatDateTime(application.startsAt)}
          </Text>
          <Text size="sm">
            <Text span c="dimmed">
              Способ оплаты:{' '}
            </Text>
            {application.paymentMethod}
          </Text>
          <Text size="sm">
            <Text span c="dimmed">
              Заявка подана:{' '}
            </Text>
            {formatDateTime(application.createdAt)}
          </Text>
        </Stack>

        {withAuthor && application.author ? (
          <Stack gap={2}>
            <Text size="sm">
              <Text span c="dimmed">
                Заявитель:{' '}
              </Text>
              {application.author.fullName} ({application.author.login})
            </Text>
            <Text size="sm" c="dimmed">
              {application.author.phone} · {application.author.email}
            </Text>
          </Stack>
        ) : null}

        {application.review ? (
          <Card withBorder padding="sm" radius="sm" bg="brand.0">
            <Stack gap={4}>
              <Group gap="xs">
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

        {actions ? <Group gap="sm">{actions}</Group> : null}
      </Stack>
    </Card>
  );
}
