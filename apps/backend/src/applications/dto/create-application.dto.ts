import { PAYMENT_METHODS, VALIDATION_MESSAGES, type PaymentMethod } from '@kim/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsPositive } from 'class-validator';

/**
 * Формирование заявки — Задание 1, п. 4: помещение, желаемая дата начала
 * конференции и способ оплаты.
 */
export class CreateApplicationDto {
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.roomRequired })
  @IsPositive({ message: VALIDATION_MESSAGES.roomRequired })
  roomId: number;

  @IsISO8601({ strict: true }, { message: VALIDATION_MESSAGES.startsAtInvalid })
  startsAt: string;

  @IsIn(PAYMENT_METHODS, { message: VALIDATION_MESSAGES.paymentMethodRequired })
  paymentMethod: PaymentMethod;
}
