import { PAYMENT_METHODS, type PaymentMethod } from '@kim/shared';
import { createMutation } from '@farfetched/core';
import { createEvent, createStore, sample } from 'effector';

import { RoomsModel } from '../../entities/room';
import { applicationsApi } from '../../shared/api';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';
import { pickerValueToIso, toPickerValue } from '../../shared/lib';
import { createModel } from '../../shared/lib/effector';
import { routes } from '../../shared/routes';

/**
 * Задание 1, п. 4: формирование заявки — помещение, желаемая дата начала
 * конференции и способ оплаты.
 */
export interface CreateValues {
  roomId: string | null;
  startsAt: string | null;
  paymentMethod: PaymentMethod | null;
}

export const PAYMENT_OPTIONS = PAYMENT_METHODS.map((method) => ({
  value: method,
  label: method,
}));

export const ApplicationCreatePageModel = createModel(() => {
  const formSubmitted = createEvent<CreateValues>();

  const createApplicationMutation = createMutation({
    name: 'createApplication',
    handler: (values: { roomId: number; startsAt: string; paymentMethod: PaymentMethod }) =>
      applicationsApi.create(values),
  });

  const $serverErrors = createStore(NO_SERVER_ERRORS).reset(formSubmitted);

  sample({
    clock: createApplicationMutation.finished.failure,
    fn: ({ error }) => parseServerError(error),
    target: $serverErrors,
  });

  /** Справочник помещений подгружается по открытию страницы. */
  sample({ clock: routes.applicationCreate.opened, target: RoomsModel.roomsRequested });

  /**
   * Нижняя граница для поля даты. Пересчитывается при каждом открытии
   * страницы: вычислять «сейчас» в разметке нельзя — это правило из ТЗ
   * («дата не в прошлом»), и на сервере проверяется то же самое.
   */
  const $minStartsAt = createStore(toPickerValue(new Date()));

  sample({
    clock: routes.applicationCreate.opened,
    fn: () => toPickerValue(new Date()),
    target: $minStartsAt,
  });

  sample({
    clock: formSubmitted,
    // Форма отдаёт строки: Select работает со строковыми значениями, а
    // DateTimePicker — со строкой `YYYY-MM-DD HH:mm:ss` в местном времени.
    // Приведения нужны потому, что сюда попадают только значения, прошедшие
    // валидацию формы, а типы об этом не знают.
    fn: (values) => ({
      roomId: Number(values.roomId),
      startsAt: pickerValueToIso(values.startsAt as string),
      paymentMethod: values.paymentMethod as PaymentMethod,
    }),
    target: createApplicationMutation.start,
  });

  /** После отправки заявка уходит администратору, а пользователь — к своим заявкам. */
  sample({
    clock: createApplicationMutation.finished.success,
    fn: (): void => undefined,
    target: routes.applications.open,
  });

  return {
    viewModel: {
      roomOptions: RoomsModel.viewModel.roomOptions,
      roomsPending: RoomsModel.viewModel.roomsPending,
      minStartsAt: $minStartsAt,
      pending: createApplicationMutation.$pending,
      serverErrors: $serverErrors,
      submit: formSubmitted,
      openApplications: routes.applications.open,
    },
    __: { createApplicationMutation: createApplicationMutation, $serverErrors },
  };
});
