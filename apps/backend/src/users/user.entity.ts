import { USER_ROLES, type UserRole } from '@kim/shared';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApplicationEntity } from '../applications/application.entity';
import { checkIn } from '../database/sql';

/**
 * Пользователь портала. Поля и правила — из Задания 1, п. 1.
 *
 * Уникален только логин: ТЗ требует «уникальный логин» и ничего не говорит про
 * уникальность email, поэтому UNIQUE на email не ставим (ADR-0003).
 */
@Entity('users')
@Check('users_role_check', checkIn('role', USER_ROLES))
export class UserEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  login: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  /** Формат из ТЗ: 8(XXX)XXX-XX-XX — ровно 15 символов. */
  @Column({ type: 'varchar', length: 15 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ApplicationEntity, (application) => application.user)
  applications: ApplicationEntity[];
}
