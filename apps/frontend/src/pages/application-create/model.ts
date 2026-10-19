import { PAYMENT_METHODS, type PaymentMethod } from '@kim/shared';
import { createEffect, createEvent, sample, createStore } from 'effector';

import { roomsRequested } from '../../entities/room';
import { applicationsApi } from '../../shared/api';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';
import { routes } from '../../shared/routes';

/**
 * Задание 1, п. 4: формирование заявки — помещение, желаемая дата начала
 * конференции и способ оплаты.
 */
export interface CreateValues {
  roomId: string | null;
  startsAt: string;
  paymentMethod: PaymentMethod | null;
}

export const PAYMENT_OPTIONS = PAYMENT_METHODS.map((method) => ({
  value: method,
  label: method,
}));

export const formSubmitted = createEvent<CreateValues>();

export const createApplicationFx = createEffect(
  (values: { roomId: number; startsAt: string; paymentMethod: PaymentMethod }) =>
    applicationsApi.create(values),
);

export const $pending = createApplicationFx.pending;

export const $serverErrors = createStore(NO_SERVER_ERRORS)
  .on(createApplicationFx.failData, (_, error) => parseServerError(error))
  .reset(formSubmitted);

/** Справочник помещений подгружается по открытию страницы. */
sample({ clock: routes.applicationCreate.opened, target: roomsRequested });

sample({
  clock: formSubmitted,
  // Форма отдаёт строки — поле Select работает со строковыми значениями,
  // а дата приходит из `datetime-local` без часового пояса.
  fn: (values) => ({
    roomId: Number(values.roomId),
    startsAt: new Date(values.startsAt).toISOString(),
    paymentMethod: values.paymentMethod as PaymentMethod,
  }),
  target: createApplicationFx,
});

/** После отправки заявка уходит администратору, а пользователь — к своим заявкам. */
sample({
  clock: createApplicationFx.done,
  fn: (): void => undefined,
  target: routes.applications.open,
});
