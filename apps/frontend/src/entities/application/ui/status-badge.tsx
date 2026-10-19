import { APPLICATION_STATUSES, type ApplicationStatus } from '@kim/shared';
import { Badge, type MantineColor } from '@mantine/core';

/**
 * Статус заявки. Подписи — дословно из ТЗ (Задание 1, п. 5), цвета помогают
 * различать их в списке и в панели администратора.
 */
const STATUS_COLOR: Record<ApplicationStatus, MantineColor> = {
  Новая: 'gray',
  'Мероприятие назначено': 'brand',
  Завершено: 'teal',
};

function isKnownStatus(status: string): status is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(status);
}

export function StatusBadge({ status }: { status: string }) {
  const color = isKnownStatus(status) ? STATUS_COLOR[status] : 'gray';

  // tt="none" обязателен: Badge по умолчанию переводит текст в верхний
  // регистр, а подписи статусов заданы ТЗ и должны совпадать буквально.
  return (
    <Badge color={color} variant="light" tt="none">
      {status}
    </Badge>
  );
}
