import { APPLICATION_STATUSES, VALIDATION_MESSAGES, type ApplicationStatus } from '@kim/shared';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Фильтры панели администратора — Задание 2, п. 5: «фильтрация данных заявок
 * пользователей».
 */
export class FilterApplicationsDto {
  @IsOptional()
  @IsIn(APPLICATION_STATUSES, { message: VALIDATION_MESSAGES.statusRequired })
  status?: ApplicationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.roomRequired })
  @IsPositive({ message: VALIDATION_MESSAGES.roomRequired })
  roomId?: number;

  /** Поиск по логину или ФИО автора заявки. */
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.required })
  author?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: VALIDATION_MESSAGES.startsAtInvalid })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: VALIDATION_MESSAGES.startsAtInvalid })
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
