import type { ApplicationDto } from '@kim/shared';
import { combine, createEffect, createEvent, createStore, sample } from 'effector';

import { applicationsApi } from '../../shared/api';
import { NO_SERVER_ERRORS, parseServerError } from '../../shared/forms';
import { createModel } from '../../shared/lib/effector';
import { toListViewState } from '../../shared/lib';
import { routes } from '../../shared/routes';

export interface ReviewValues {
  rating: number;
  text: string;
}

/**
 * Задание 1, п. 3: «авторизованный пользователь имеет возможность просмотреть
 * свои ранее оставленные заявки, а также оставить отзыв о качестве
 * проведённого мероприятия».
 *
 * Данные грузятся по открытию роута, а не при монтировании компонента
 * (ADR-0006).
 */
export const ApplicationsPageModel = createModel(() => {
  const fetchApplicationsFx = createEffect(applicationsApi.mine);

  const $applications = createStore<ApplicationDto[]>([]).on(
    fetchApplicationsFx.doneData,
    (_, items) => items,
  );

  const $loadError = createStore<string | null>(null)
    .on(fetchApplicationsFx.failData, (_, error) => parseServerError(error).message)
    .reset(fetchApplicationsFx);

  sample({ clock: routes.applications.opened, target: fetchApplicationsFx });

  // --- отзыв о мероприятии ---

  /** Какая заявка сейчас отзывается. null — форма закрыта. */
  const reviewFormOpened = createEvent<number>();
  const reviewFormClosed = createEvent();
  const reviewSubmitted = createEvent<ReviewValues>();

  const $reviewingId = createStore<number | null>(null)
    .on(reviewFormOpened, (_, id) => id)
    .reset(reviewFormClosed);

  const addReviewFx = createEffect(
    ({ applicationId, values }: { applicationId: number; values: ReviewValues }) =>
      applicationsApi.addReview(applicationId, values),
  );

  const $reviewErrors = createStore(NO_SERVER_ERRORS)
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
  const $viewState = combine(
    $applications,
    fetchApplicationsFx.pending,
    $loadError,
    (items, pending, error) => toListViewState({ items, pending, error }),
  );

  return {
    viewModel: {
      viewState: $viewState,
      applicationsCount: $applications.map((items) => items.length),
      reviewingId: $reviewingId,
      reviewErrors: $reviewErrors,
      reviewPending: addReviewFx.pending,
      openReview: reviewFormOpened,
      closeReview: reviewFormClosed,
      submitReview: reviewSubmitted,
      openCreate: routes.applicationCreate.open,
    },
    __: { $applications, $loadError, fetchApplicationsFx, addReviewFx },
  };
});
