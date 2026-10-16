import {
  APPLICATION_STATUS_INITIAL,
  APPLICATION_STATUSES,
  PAYMENT_METHODS,
  type ApplicationStatus,
  type PaymentMethod,
} from '@kim/shared';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { checkIn } from '../database/sql';
import { ReviewEntity } from '../reviews/review.entity';
import { RoomEntity } from '../rooms/room.entity';
import { UserEntity } from '../users/user.entity';

/**
 * Заявка на бронирование помещения (Задание 1, п. 4–5).
 *
 * Статус при создании — «Новая»; администратор переводит её в
 * «Мероприятие назначено» или «Завершено».
 */
@Entity('applications')
@Check('applications_status_check', checkIn('status', APPLICATION_STATUSES))
@Check('applications_payment_method_check', checkIn('payment_method', PAYMENT_METHODS))
export class ApplicationEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index('applications_user_id_idx')
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.applications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Index('applications_room_id_idx')
  @Column({ name: 'room_id', type: 'int' })
  roomId: number;

  @ManyToOne(() => RoomEntity, (room) => room.applications, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;

  /**
   * Желаемое начало конференции. Со временем, а не только дата: в описании
   * предметной области сказано «указывать предпочтительное время начала».
   */
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'payment_method', type: 'varchar', length: 32 })
  paymentMethod: PaymentMethod;

  @Index('applications_status_idx')
  @Column({ type: 'varchar', length: 32, default: APPLICATION_STATUS_INITIAL })
  status: ApplicationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => ReviewEntity, (review) => review.application)
  review: ReviewEntity | null;
}
