import type { ApplicationStatus } from '@kim/shared';
import { Badge, type MantineColor } from '@mantine/core';

/**
 * Статус заявки. Подписи — дословно из ТЗ (Задание 1, п. 5), цвета помогают
 * различать их в списке и в панели администратора (ADR-0008).
 *
 * `Record<ApplicationStatus, …>` даёт исчерпывающую проверку бесплатно: если в
 * ТЗ появится четвёртый статус, TypeScript потребует добавить ему цвет здесь.
 * Отдельная библиотека сопоставления для этого не нужна.
 */
const STATUS_COLOR: Record<ApplicationStatus, MantineColor> = {
  Новая: 'gray',
  'Мероприятие назначено': 'brand',
  Завершено: 'teal',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  // tt="none" обязателен: Badge по умолчанию переводит текст в верхний
  // регистр, а подписи статусов заданы ТЗ и должны совпадать буквально.
  return (
    <Badge color={STATUS_COLOR[status]} variant="light" tt="none">
      {status}
    </Badge>
  );
}
