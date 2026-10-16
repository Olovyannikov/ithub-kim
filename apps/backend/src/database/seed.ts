import { ROOM_KINDS, type RoomKind } from '@kim/shared';
import { DataSource } from 'typeorm';

import { RoomEntity } from '../rooms/room.entity';
import { dataSourceOptions } from './data-source.options';

/**
 * Наполнение справочников.
 *
 * Пока только помещения: пользователей и заявки сидировать нельзя, пока не
 * выбран способ хеширования пароля — это ADR-0004 (Часть 2). Там же появится
 * администратор Conf2027 и демонстрационные заявки.
 *
 * Скрипт идемпотентен: помещения сопоставляются по названию, повторный запуск
 * ничего не дублирует.
 */
interface RoomSeed {
  name: string;
  kind: RoomKind;
  capacity: number;
  description: string;
}

const ROOMS: readonly RoomSeed[] = [
  {
    name: 'Аудитория «Ломоносов»',
    kind: 'Аудитория',
    capacity: 120,
    description: 'Поточная аудитория с амфитеатром, проектором и микрофонной системой.',
  },
  {
    name: 'Аудитория «Вернадский»',
    kind: 'Аудитория',
    capacity: 60,
    description: 'Аудитория для секционных заседаний, доска и панель для презентаций.',
  },
  {
    name: 'Аудитория «Менделеев»',
    kind: 'Аудитория',
    capacity: 30,
    description: 'Небольшая аудитория для круглых столов и мастер-классов.',
  },
  {
    name: 'Коворкинг «Открытое пространство»',
    kind: 'Коворкинг',
    capacity: 80,
    description: 'Открытая зона с трансформируемой мебелью для воркшопов и нетворкинга.',
  },
  {
    name: 'Коворкинг «Мансарда»',
    kind: 'Коворкинг',
    capacity: 40,
    description: 'Светлое пространство с панорамными окнами и зоной для кофе-брейка.',
  },
  {
    name: 'Коворкинг «Переговорная №7»',
    kind: 'Коворкинг',
    capacity: 16,
    description: 'Переговорная комната с видеоконференцсвязью для рабочих групп.',
  },
  {
    name: 'Кинозал «Премьера»',
    kind: 'Кинозал',
    capacity: 200,
    description: 'Большой зал с экраном 12 метров и звуком 7.1 для пленарных заседаний.',
  },
  {
    name: 'Кинозал «Хроника»',
    kind: 'Кинозал',
    capacity: 90,
    description: 'Зал для показов и презентаций с наклонным партером.',
  },
  {
    name: 'Кинозал «Камера»',
    kind: 'Кинозал',
    capacity: 45,
    description: 'Компактный зал для просмотров и обсуждений в малых группах.',
  },
];

async function seed(): Promise<void> {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  try {
    const rooms = dataSource.getRepository(RoomEntity);
    let created = 0;

    for (const seedRoom of ROOMS) {
      const existing = await rooms.findOne({ where: { name: seedRoom.name } });

      if (existing) {
        continue;
      }

      await rooms.save(rooms.create(seedRoom));
      created += 1;
    }

    const total = await rooms.count();

    // eslint-disable-next-line no-console
    console.log(
      `[seed] помещения: добавлено ${created}, всего в базе ${total} ` +
        `(${ROOM_KINDS.join(', ')})`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void seed().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed] не удалось выполнить:', error);
  process.exitCode = 1;
});
