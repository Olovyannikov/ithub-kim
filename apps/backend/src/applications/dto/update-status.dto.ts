import {
  APPLICATION_STATUSES_ADMIN_ASSIGNABLE,
  VALIDATION_MESSAGES,
  type ApplicationStatus,
} from '@kim/shared';
import { IsIn } from 'class-validator';

/**
 * Смена статуса заявки администратором — Задание 1, п. 5.
 *
 * Допустимы только «Мероприятие назначено» и «Завершено»: статус «Новая»
 * выставляется системой при создании и вручную не ставится (ADR-0003).
 */
export class UpdateStatusDto {
  @IsIn(APPLICATION_STATUSES_ADMIN_ASSIGNABLE, {
    message: VALIDATION_MESSAGES.statusNotAssignable,
  })
  status: ApplicationStatus;
}
