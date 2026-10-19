import { PAYMENT_METHODS, type PaymentMethod } from '@kim/shared';
import { createEffect, createEvent, createStore, sample } from 'effector';

import { RoomsModel } from '../../entities/room';
import { applicationsApi } from '../../shared/api';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';
import { toDateTimeLocalValue } from '../../shared/lib';
import { createModel } from '../../shared/lib/effector';
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

export const ApplicationCreatePageModel = createModel(() => {
  const formSubmitted = createEvent<CreateValues>();

  const createApplicationFx = createEffect(
    (values: { roomId: number; startsAt: string; paymentMethod: PaymentMethod }) =>
      applicationsApi.create(values),
  );

  const $serverErrors = createStore(NO_SERVER_ERRORS).reset(formSubmitted);

  sample({ clock: createApplicationFx.failData, fn: parseServerError, target: $serverErrors });

  /** Справочник помещений подгружается по открытию страницы. */
  sample({ clock: routes.applicationCreate.opened, target: RoomsModel.roomsRequested });

  /**
   * Нижняя граница для поля даты. Пересчитывается при каждом открытии
   * страницы: вычислять «сейчас» в разметке нельзя — это правило из ТЗ
   * («дата не в прошлом»), и на сервере проверяется то же самое.
   */
  const $minStartsAt = createStore(toDateTimeLocalValue(new Date()));

  sample({
    clock: routes.applicationCreate.opened,
    fn: () => toDateTimeLocalValue(new Date()),
    target: $minStartsAt,
  });

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

  return {
    viewModel: {
      roomOptions: RoomsModel.viewModel.roomOptions,
      roomsPending: RoomsModel.viewModel.roomsPending,
      minStartsAt: $minStartsAt,
      pending: createApplicationFx.pending,
      serverErrors: $serverErrors,
      submit: formSubmitted,
      openApplications: routes.applications.open,
    },
    __: { createApplicationFx, $serverErrors },
  };
});
