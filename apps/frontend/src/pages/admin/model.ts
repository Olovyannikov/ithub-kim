import {
  APPLICATION_STATUSES,
  APPLICATION_STATUSES_ADMIN_ASSIGNABLE,
  type ApplicationDto,
  type ApplicationStatus,
} from '@kim/shared';
import { combine, createEffect, createEvent, createStore, sample } from 'effector';

import { roomsRequested } from '../../entities/room';
import { applicationsApi } from '../../shared/api';
import { parseServerError } from '../../shared/forms';
import { routes } from '../../shared/routes';

/**
 * Задание 1, п. 5 и Задание 2, п. 5: панель администратора — все заявки
 * зарегистрированных пользователей, фильтрация и смена статуса.
 */
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

export const filtersChanged = createEvent<Filters>();
export const filtersReset = createEvent();
export const pageChanged = createEvent<number>();
export const statusChangeRequested = createEvent<{ id: number; status: ApplicationStatus }>();

export const $filters = createStore(EMPTY_FILTERS)
  .on(filtersChanged, (_, filters) => filters)
  .reset(filtersReset);

export const $page = createStore(1)
  .on(pageChanged, (_, page) => page)
  // Любая смена фильтров возвращает на первую страницу — иначе можно оказаться
  // на седьмой странице пустого результата.
  .reset(filtersChanged, filtersReset);

export const fetchAllFx = createEffect(applicationsApi.all);

export const updateStatusFx = createEffect(
  ({ id, status }: { id: number; status: ApplicationStatus }) =>
    applicationsApi.updateStatus(id, { status }),
);

export const $items = createStore<ApplicationDto[]>([])
  .on(fetchAllFx.doneData, (_, page) => page.items)
  // Сервер возвращает обновлённую заявку — подменяем её на месте, без
  // перезагрузки всего списка.
  .on(updateStatusFx.doneData, (items, updated) =>
    items.map((item) => (item.id === updated.id ? updated : item)),
  );

export const $total = createStore(0).on(fetchAllFx.doneData, (_, page) => page.total);
export const $pending = fetchAllFx.pending;
export const $updatingId = createStore<number | null>(null)
  .on(updateStatusFx, (_, { id }) => id)
  .reset(updateStatusFx.finally);

export const $error = createStore<string | null>(null)
  .on([fetchAllFx.failData, updateStatusFx.failData], (_, error) => parseServerError(error).message)
  .reset(fetchAllFx, updateStatusFx);

export const $pageCount = $total.map((total) => Math.max(1, Math.ceil(total / PAGE_SIZE)));

export const $isEmpty = combine(
  $items,
  $pending,
  (items, pending) => !pending && items.length === 0,
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

sample({ clock: routes.admin.opened, target: roomsRequested });

sample({
  clock: [routes.admin.opened, filtersChanged, filtersReset, pageChanged],
  source: $query,
  target: fetchAllFx,
});

sample({ clock: statusChangeRequested, target: updateStatusFx });
