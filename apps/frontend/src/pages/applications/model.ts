import type { ApplicationDto } from '@kim/shared';
import { combine, createEffect, createEvent, createStore, sample } from 'effector';

import { applicationsApi } from '../../shared/api';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';
import { toListViewState } from '../../shared/lib';
import { routes } from '../../shared/routes';

/**
 * Задание 1, п. 3: «авторизованный пользователь имеет возможность просмотреть
 * свои ранее оставленные заявки, а также оставить отзыв о качестве
 * проведённого мероприятия».
 *
 * Данные грузятся по открытию роута, а не при монтировании компонента
 * (ADR-0006).
 */
export const fetchApplicationsFx = createEffect(applicationsApi.mine);

export const $applications = createStore<ApplicationDto[]>([]).on(
  fetchApplicationsFx.doneData,
  (_, items) => items,
);

export const $pending = fetchApplicationsFx.pending;
export const $loadError = createStore<string | null>(null)
  .on(fetchApplicationsFx.failData, (_, error) => parseServerError(error).message)
  .reset(fetchApplicationsFx);

sample({ clock: routes.applications.opened, target: fetchApplicationsFx });

// --- отзыв о мероприятии ---

export interface ReviewValues {
  rating: number;
  text: string;
}

/** Какая заявка сейчас отзывается. null — форма закрыта. */
export const reviewFormOpened = createEvent<number>();
export const reviewFormClosed = createEvent();
export const reviewSubmitted = createEvent<ReviewValues>();

export const $reviewingId = createStore<number | null>(null)
  .on(reviewFormOpened, (_, id) => id)
  .reset(reviewFormClosed);

export const addReviewFx = createEffect(
  ({ applicationId, values }: { applicationId: number; values: ReviewValues }) =>
    applicationsApi.addReview(applicationId, values),
);

export const $reviewPending = addReviewFx.pending;

export const $reviewErrors = createStore(NO_SERVER_ERRORS)
  .on(addReviewFx.failData, (_, error) => parseServerError(error))
  .reset(reviewFormOpened, reviewSubmitted);

sample({
  clock: reviewSubmitted,
  source: $reviewingId,
  filter: (applicationId) => applicationId !== null,
  // Сужение из `filter` не доходит до `fn` в типах effector, поэтому здесь
  // нужен явный тип: `filter` выше уже гарантирует, что значение не null.
  fn: (applicationId, values) => ({ applicationId: applicationId as number, values }),
  target: addReviewFx,
});

/**
 * Сохранённый отзыв заменяет заявку в списке, а не вызывает перезагрузку
 * страницы: сервер уже вернул обновлённую заявку.
 */
$applications.on(addReviewFx.doneData, (items, updated) =>
  items.map((item) => (item.id === updated.id ? updated : item)),
);

sample({ clock: addReviewFx.done, target: reviewFormClosed });

/**
 * Состояние страницы одним значением: загрузка, ошибка, пустота или список.
 * Решение принимается здесь, компонент только сопоставляет вариант с
 * разметкой (ADR-0006).
 */
export const $viewState = combine($applications, $pending, $loadError, (items, pending, error) =>
  toListViewState({ items, pending, error }),
);
