/**
 * Домен портала «Конференции.РФ».
 *
 * Значения взяты дословно из текста задания КИМ 09.02.07-3-2027 (Задание 1, п. 1–5).
 * Менять формулировки нельзя: эксперт сверяет интерфейс с текстом ТЗ.
 */

/** Типы помещений для проведения конференции. */
export const ROOM_KINDS = ['Аудитория', 'Коворкинг', 'Кинозал'] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];

/** Способы оплаты из п. 4 задания. */
export const PAYMENT_METHODS = ['При очном посещении', 'Переводом по системе СБП'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Статусы заявки из п. 5 задания.
 * Изначально заявка имеет статус «Новая»; администратор переводит её
 * в «Мероприятие назначено» или «Завершено».
 */
export const APPLICATION_STATUSES = ['Новая', 'Мероприятие назначено', 'Завершено'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_INITIAL: ApplicationStatus = 'Новая';

/** Статусы, которые администратор может выставить вручную. */
export const APPLICATION_STATUSES_ADMIN_ASSIGNABLE: readonly ApplicationStatus[] = [
  'Мероприятие назначено',
  'Завершено',
];

/**
 * Оставить отзыв можно только после завершения мероприятия
 * (Задание 2, п. 3 — личный кабинет).
 */
export function canLeaveReview(status: ApplicationStatus): boolean {
  return status === 'Завершено';
}

/** Роли пользователей системы. */
export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Учётные данные администратора заданы в КИМ жёстко (Задание 1, п. 5).
 * Пароль здесь не хранится — он попадает в БД хешем на этапе сидирования.
 */
export const ADMIN_LOGIN = 'Conf2027';
