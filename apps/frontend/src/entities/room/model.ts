import type { RoomDto } from '@kim/shared';
import { createEffect, createEvent, createStore, sample } from 'effector';

import { roomsApi } from '../../shared/api';

/**
 * Справочник помещений. Нужен для выпадающего списка в форме заявки
 * (Задание 2, п. 4) и для фильтра в панели администратора (п. 5).
 */
export const roomsRequested = createEvent();

export const fetchRoomsFx = createEffect(roomsApi.list);

export const $rooms = createStore<RoomDto[]>([]).on(fetchRoomsFx.doneData, (_, rooms) => rooms);

export const $roomsPending = fetchRoomsFx.pending;

/**
 * Варианты для `Select`, сгруппированные по типу помещения: аудитория,
 * коворкинг, кинозал.
 */
export const $roomOptions = $rooms.map((rooms) => {
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

sample({ clock: roomsRequested, target: fetchRoomsFx });
