import {
  APPLICATION_STATUSES,
  APPLICATION_STATUSES_ADMIN_ASSIGNABLE,
  type ApplicationDto,
  type ApplicationStatus,
} from '@kim/shared';
import { combine, createEffect, createEvent, createStore, sample } from 'effector';
import { debounce } from 'patronum';

import { RoomsModel } from '../../entities/room';
import { applicationsApi } from '../../shared/api';
import { parseServerError } from '../../shared/forms';
import { createModel } from '../../shared/lib/effector';
import { toListViewState } from '../../shared/lib';
import { routes } from '../../shared/routes';

export const PAGE_SIZE = 10;

export interface Filters {
  status: ApplicationStatus | null;
  roomId: string | null;
  author: string;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: Filters = {
  status: null,
  roomId: null,
  author: '',
  from: '',
  to: '',
};

export const STATUS_OPTIONS = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

export const ASSIGNABLE_STATUS_OPTIONS = APPLICATION_STATUSES_ADMIN_ASSIGNABLE.map((status) => ({
  value: status,
  label: status,
}));

/**
 * Задание 1, п. 5 и Задание 2, п. 5: панель администратора — все заявки
 * зарегистрированных пользователей, фильтрация и смена статуса.
 */
export const AdminPageModel = createModel(() => {
  const filtersChanged = createEvent<Filters>();
  const filtersReset = createEvent();
  const pageChanged = createEvent<number>();
  const statusChangeRequested = createEvent<{ id: number; status: ApplicationStatus }>();

  const $filters = createStore(EMPTY_FILTERS)
    .on(filtersChanged, (_, filters) => filters)
    .reset(filtersReset);

  const $page = createStore(1)
    .on(pageChanged, (_, page) => page)
    // Любая смена фильтров возвращает на первую страницу — иначе можно оказаться
    // на седьмой странице пустого результата.
    .reset(filtersChanged, filtersReset);

  const fetchAllFx = createEffect(applicationsApi.all);

  const updateStatusFx = createEffect(({ id, status }: { id: number; status: ApplicationStatus }) =>
    applicationsApi.updateStatus(id, { status }),
  );

  const $items = createStore<ApplicationDto[]>([])
    .on(fetchAllFx.doneData, (_, page) => page.items)
    // Сервер возвращает обновлённую заявку — подменяем её на месте, без
    // перезагрузки всего списка.
    .on(updateStatusFx.doneData, (items, updated) =>
      items.map((item) => (item.id === updated.id ? updated : item)),
    );

  const $total = createStore(0).on(fetchAllFx.doneData, (_, page) => page.total);

  const $updatingId = createStore<number | null>(null)
    .on(updateStatusFx, (_, { id }) => id)
    .reset(updateStatusFx.finally);

  const $error = createStore<string | null>(null)
    .on(
      [fetchAllFx.failData, updateStatusFx.failData],
      (_, error) => parseServerError(error).message,
    )
    .reset(fetchAllFx, updateStatusFx);

  const $pageCount = $total.map((total) => Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const $viewState = combine($items, fetchAllFx.pending, $error, (items, pending, error) =>
    toListViewState({ items, pending, error }),
  );

  /** Запрос собирается из фильтров и номера страницы в одном месте. */
  const $query = combine($filters, $page, (filters, page) => ({
    status: filters.status ?? undefined,
    roomId: filters.roomId ? Number(filters.roomId) : undefined,
    author: filters.author.trim() || undefined,
    from: filters.from ? new Date(filters.from).toISOString() : undefined,
    to: filters.to ? new Date(filters.to).toISOString() : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }));

  sample({ clock: routes.admin.opened, target: RoomsModel.roomsRequested });

  /**
   * Фильтры с задержкой.
   *
   * Поле «Заявитель» — обычный ввод, и без задержки каждый символ уходил
   * отдельным запросом: замер показал девять запросов на девять символов.
   * Задержка в 300 мс оставляет один. Открытие страницы, сброс и смена
   * страницы задержки не требуют — там событие однократное.
   */
  const filtersSettled = debounce(filtersChanged, 300);

  sample({
    clock: [routes.admin.opened, filtersSettled, filtersReset, pageChanged],
    source: $query,
    target: fetchAllFx,
  });

  sample({ clock: statusChangeRequested, target: updateStatusFx });

  return {
    viewModel: {
      viewState: $viewState,
      total: $total,
      filters: $filters,
      page: $page,
      pageCount: $pageCount,
      updatingId: $updatingId,
      roomOptions: RoomsModel.viewModel.roomOptions,
      changeFilters: filtersChanged,
      resetFilters: filtersReset,
      changePage: pageChanged,
      changeStatus: statusChangeRequested,
    },
    __: { $items, $error, $query, fetchAllFx, updateStatusFx },
  };
});
