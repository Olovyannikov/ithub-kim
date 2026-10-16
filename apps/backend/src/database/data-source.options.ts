import { join } from 'node:path';

import type { DataSourceOptions } from 'typeorm';

import { ApplicationEntity } from '../applications/application.entity';
import { ReviewEntity } from '../reviews/review.entity';
import { RoomEntity } from '../rooms/room.entity';
import { UserEntity } from '../users/user.entity';

// Переменные окружения нужны и CLI миграций, и сид-скрипту — там нет
// ConfigModule из Nest. Читаем .env средствами Node, без лишней зависимости.
try {
  process.loadEnvFile(join(__dirname, '..', '..', '..', '..', '.env'));
} catch {
  // .env может отсутствовать: тогда работаем на переменных окружения процесса.
}

/**
 * Сущности перечислены явно, а не глобом: так одинаково работает и собранный
 * dist, и тесты, и не приходится угадывать рабочий каталог.
 */
export const entities = [UserEntity, RoomEntity, ApplicationEntity, ReviewEntity];

export const dataSourceOptions: DataSourceOptions = {
  // Единственная строка, которую нужно поменять для переезда на MySQL
  // (план отхода из ADR-0001): 'postgres' -> 'mysql'.
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: [join(__dirname, 'migrations', '*.js')],
  // Схема меняется только миграциями. Аварийный путь на экзамене —
  // выставить true и получить таблицы прямо из сущностей (ADR-0003).
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true',
};
