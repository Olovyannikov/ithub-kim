import type { RoomDto } from '@kim/shared';
import { cache, createQuery } from '@farfetched/core';
import { createEvent, sample } from 'effector';

import { roomsApi } from '../../shared/api';
import { createModel } from '../../shared/lib/effector';

/**
 * Справочник помещений. Нужен для выпадающего списка в форме заявки
 * (Задание 2, п. 4) и для фильтра в панели администратора (п. 5).
 */
export const RoomsModel = createModel(() => {
  const roomsRequested = createEvent();

  const roomsQuery = createQuery({ handler: roomsApi.list, name: 'rooms' });

  // Справочник статичен, поэтому ответ живёт в памяти десять минут: повторные
  // заходы на страницу заявки и в панель администратора запрос не повторяют.
  cache(roomsQuery, { staleAfter: '10m' });

  const $rooms = roomsQuery.$data.map<RoomDto[]>((rooms) => rooms ?? []);

  /**
   * Варианты для `Select`, сгруппированные по типу помещения: аудитория,
   * коворкинг, кинозал.
   */
  const $roomOptions = $rooms.map((rooms) => {
    const groups = new Map<string, { value: string; label: string }[]>();

    for (const room of rooms) {
      const items = groups.get(room.kind) ?? [];
      items.push({
        value: String(room.id),
        label: room.capacity ? `${room.name} — до ${room.capacity} человек` : room.name,
      });
      groups.set(room.kind, items);
    }

    return [...groups.entries()].map(([group, items]) => ({ group, items }));
  });

  sample({ clock: roomsRequested, target: roomsQuery.start });

  return {
    viewModel: {
      roomOptions: $roomOptions,
      roomsPending: roomsQuery.$pending,
    },
    /** Другие модели просят справочник при открытии своей страницы. */
    roomsRequested,
    $rooms,
    __: { roomsQuery },
  };
});
