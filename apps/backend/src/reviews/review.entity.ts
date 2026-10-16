import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ApplicationEntity } from '../applications/application.entity';

/**
 * Отзыв о качестве проведённого мероприятия (Задание 1, п. 3).
 *
 * Один отзыв на одну заявку — отсюда UNIQUE на application_id. Право оставить
 * отзыв появляется только после завершения мероприятия (Задание 2, п. 3):
 * проверка статуса живёт в `canLeaveReview` из @kim/shared.
 *
 * Поле `rating` — наша трактовка формулировки «отзыв о качестве», а не буква ТЗ
 * (ADR-0003).
 */
@Entity('reviews')
@Check('reviews_rating_check', '"rating" BETWEEN 1 AND 5')
export class ReviewEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // UNIQUE здесь не нужен: его создаёт @OneToOne вместе с @JoinColumn ниже.
  @Column({ name: 'application_id', type: 'int' })
  applicationId: number;

  @OneToOne(() => ApplicationEntity, (application) => application.review, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: ApplicationEntity;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
