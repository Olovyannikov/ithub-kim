import type { ApplicationDto } from '@kim/shared';
import { createMutation, createQuery } from '@farfetched/core';
import { combine, createEvent, createStore, sample } from 'effector';

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
  const applicationsQuery = createQuery({ name: 'myApplications', handler: applicationsApi.mine });

  const $applications = createStore<ApplicationDto[]>([]);
  const $loadError = createStore<string | null>(null).reset(applicationsQuery.started);

  sample({
    clock: applicationsQuery.finished.success,
    fn: ({ result }) => result,
    target: $applications,
  });

  sample({
    clock: applicationsQuery.finished.failure,
    fn: ({ error }) => parseServerError(error).message,
    target: $loadError,
  });

  sample({ clock: routes.applications.opened, target: applicationsQuery.start });

  // --- отзыв о мероприятии ---

  /** Какая заявка сейчас отзывается. null — форма закрыта. */
  const reviewFormOpened = createEvent<number>();
  const reviewFormClosed = createEvent();
  const reviewSubmitted = createEvent<ReviewValues>();

  const $reviewingId = createStore<number | null>(null).reset(reviewFormClosed);

  sample({ clock: reviewFormOpened, target: $reviewingId });

  const addReviewMutation = createMutation({
    name: 'addReview',
    handler: ({ applicationId, values }: { applicationId: number; values: ReviewValues }) =>
      applicationsApi.addReview(applicationId, values),
  });

  const $reviewErrors = createStore(NO_SERVER_ERRORS).reset(reviewFormOpened, reviewSubmitted);

  sample({
    clock: addReviewMutation.finished.failure,
    fn: ({ error }) => parseServerError(error),
    target: $reviewErrors,
  });

  sample({
    clock: reviewSubmitted,
    source: $reviewingId,
    filter: (applicationId) => applicationId !== null,
    // Сужение из `filter` не доходит до `fn` в типах effector, поэтому здесь
    // нужен явный тип: `filter` выше уже гарантирует, что значение не null.
    fn: (applicationId, values) => ({ applicationId: applicationId as number, values }),
    target: addReviewMutation.start,
  });

  /**
   * Сохранённый отзыв заменяет заявку в списке, а не вызывает перезагрузку
   * страницы: сервер уже вернул обновлённую заявку.
   */
  sample({
    clock: addReviewMutation.finished.success,
    source: $applications,
    fn: (items, { result }) => items.map((item) => (item.id === result.id ? result : item)),
    target: $applications,
  });

  sample({ clock: addReviewMutation.finished.success, target: reviewFormClosed });

  /**
   * Состояние страницы одним значением: загрузка, ошибка, пустота или список.
   * Решение принимается здесь, компонент только сопоставляет вариант с
   * разметкой (ADR-0006).
   */
  const $viewState = combine(
    $applications,
    applicationsQuery.$pending,
    $loadError,
    (items, pending, error) => toListViewState({ items, pending, error }),
  );

  return {
    viewModel: {
      viewState: $viewState,
      applicationsCount: $applications.map((items) => items.length),
      reviewingId: $reviewingId,
      reviewErrors: $reviewErrors,
      reviewPending: addReviewMutation.$pending,
      openReview: reviewFormOpened,
      closeReview: reviewFormClosed,
      submitReview: reviewSubmitted,
      openCreate: routes.applicationCreate.open,
    },
    __: { $applications, $loadError, applicationsQuery, addReviewMutation },
  };
});
