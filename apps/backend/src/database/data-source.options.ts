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
  /**
   * Схема меняется миграциями — так её состояние воспроизводимо и видно в
   * истории коммитов.
   *
   * На экзамене это переключается переменной `DB_SYNCHRONIZE=true`: тогда
   * TypeORM приводит базу к сущностям при каждом старте, и правка схемы
   * занимает ноль действий вместо «собрать → сгенерировать → применить».
   * Цена — изменение столбца может потерять данные, и история схемы не
   * ведётся. Для подготовки это неприемлемо, для прогона на 1 ч 30 мин —
   * ровно то, что нужно (ADR-0003).
   */
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
};
