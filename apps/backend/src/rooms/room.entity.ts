import { ROOM_KINDS, type RoomKind } from '@kim/shared';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApplicationEntity } from '../applications/application.entity';
import { checkIn } from '../database/sql';

/**
 * Помещение для проведения конференции: аудитория, коворкинг, кинозал.
 *
 * Отдельная таблица, а не строка в заявке: Задание 2 требует заменить ручной
 * ввод названия на выпадающий список, а панель администратора — фильтровать
 * заявки по помещению (ADR-0003).
 */
@Entity('rooms')
@Check('rooms_kind_check', checkIn('kind', ROOM_KINDS))
export class RoomEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  kind: RoomKind;

  /** Вместимость в человек. */
  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => ApplicationEntity, (application) => application.room)
  applications: ApplicationEntity[];
}
