import {
  ADMIN_LOGIN,
  ROOM_KINDS,
  type ApplicationStatus,
  type PaymentMethod,
  type RoomKind,
} from '@kim/shared';
import { DataSource } from 'typeorm';

import { ApplicationEntity } from '../applications/application.entity';
import { PasswordService } from '../auth/password.service';
import { ReviewEntity } from '../reviews/review.entity';
import { RoomEntity } from '../rooms/room.entity';
import { UserEntity } from '../users/user.entity';
import { dataSourceOptions } from './data-source.options';

/**
 * Наполнение базы: справочник помещений, администратор из ТЗ, демонстрационные
 * пользователи и заявки во всех трёх статусах.
 *
 * Скрипт идемпотентен: помещения сопоставляются по названию, пользователи — по
 * логину, заявки создаются только если у пользователя их ещё нет. Повторный
 * запуск ничего не дублирует.
 *
 * Администратор создаётся здесь напрямую, минуя DTO регистрации: пароль
 * `Demo77` задан КИМ жёстко и **не проходит нашу же валидацию** (в ТЗ минимум
 * 8 символов, здесь шесть). Правила валидации относятся к регистрации
 * пользователей, а не к сидированию — см. ADR-0004.
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

interface UserSeed {
  login: string;
  password: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'user' | 'admin';
}

/** Учётные данные администратора заданы КИМ: Задание 1, п. 5. */
const ADMIN: UserSeed = {
  login: ADMIN_LOGIN,
  password: 'Demo77',
  fullName: 'Администратор Портала Конференций',
  phone: '8(495)000-00-00',
  email: 'admin@conferences.rf',
  role: 'admin',
};

const USERS: readonly UserSeed[] = [
  {
    login: 'petrova01',
    password: 'DemoPass123',
    fullName: 'Петрова Анна Сергеевна',
    phone: '8(921)555-11-22',
    email: 'petrova@example.ru',
    role: 'user',
  },
  {
    login: 'sidorov02',
    password: 'DemoPass123',
    fullName: 'Сидоров Дмитрий Олегович',
    phone: '8(916)777-33-44',
    email: 'sidorov@example.ru',
    role: 'user',
  },
];

interface ApplicationSeed {
  userLogin: string;
  roomName: string;
  daysFromNow: number;
  paymentMethod: PaymentMethod;
  status: ApplicationStatus;
  review?: { rating: number; text: string };
}

/** По одной заявке в каждом статусе — чтобы панель администратора и фильтры было на чём проверять. */
const APPLICATIONS: readonly ApplicationSeed[] = [
  {
    userLogin: 'petrova01',
    roomName: 'Кинозал «Премьера»',
    daysFromNow: 21,
    paymentMethod: 'Переводом по системе СБП',
    status: 'Новая',
  },
  {
    userLogin: 'petrova01',
    roomName: 'Коворкинг «Мансарда»',
    daysFromNow: 10,
    paymentMethod: 'При очном посещении',
    status: 'Мероприятие назначено',
  },
  {
    userLogin: 'sidorov02',
    roomName: 'Аудитория «Ломоносов»',
    daysFromNow: -14,
    paymentMethod: 'Переводом по системе СБП',
    status: 'Завершено',
    review: {
      rating: 5,
      text: 'Конференция прошла на высоком уровне: звук и проектор работали без нареканий.',
    },
  },
  {
    userLogin: 'sidorov02',
    roomName: 'Аудитория «Менделеев»',
    daysFromNow: -30,
    paymentMethod: 'При очном посещении',
    status: 'Завершено',
  },
];

async function seed(): Promise<void> {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  try {
    const rooms = dataSource.getRepository(RoomEntity);
    const users = dataSource.getRepository(UserEntity);
    const applications = dataSource.getRepository(ApplicationEntity);
    const reviews = dataSource.getRepository(ReviewEntity);
    const passwords = new PasswordService();

    let createdRooms = 0;

    for (const seedRoom of ROOMS) {
      if (await rooms.exists({ where: { name: seedRoom.name } })) {
        continue;
      }

      await rooms.save(rooms.create(seedRoom));
      createdRooms += 1;
    }

    let createdUsers = 0;

    for (const seedUser of [ADMIN, ...USERS]) {
      if (await users.exists({ where: { login: seedUser.login } })) {
        continue;
      }

      await users.save(
        users.create({
          login: seedUser.login,
          passwordHash: await passwords.hash(seedUser.password),
          fullName: seedUser.fullName,
          phone: seedUser.phone,
          email: seedUser.email,
          role: seedUser.role,
        }),
      );
      createdUsers += 1;
    }

    let createdApplications = 0;

    for (const seedApplication of APPLICATIONS) {
      const user = await users.findOne({ where: { login: seedApplication.userLogin } });
      const room = await rooms.findOne({ where: { name: seedApplication.roomName } });

      if (!user || !room) {
        continue;
      }

      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + seedApplication.daysFromNow);
      startsAt.setHours(10, 0, 0, 0);

      if (await applications.exists({ where: { userId: user.id, roomId: room.id } })) {
        continue;
      }

      const application = await applications.save(
        applications.create({
          userId: user.id,
          roomId: room.id,
          startsAt,
          paymentMethod: seedApplication.paymentMethod,
          status: seedApplication.status,
        }),
      );
      createdApplications += 1;

      if (seedApplication.review) {
        await reviews.save(
          reviews.create({
            applicationId: application.id,
            rating: seedApplication.review.rating,
            text: seedApplication.review.text,
          }),
        );
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      [
        `[seed] помещения: +${createdRooms}, всего ${await rooms.count()} (${ROOM_KINDS.join(', ')})`,
        `[seed] пользователи: +${createdUsers}, всего ${await users.count()}`,
        `[seed] заявки: +${createdApplications}, всего ${await applications.count()}`,
        `[seed] администратор: ${ADMIN.login} / ${ADMIN.password} (задан КИМ)`,
      ].join('\n'),
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
