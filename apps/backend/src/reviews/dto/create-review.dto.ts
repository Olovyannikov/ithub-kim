import { RATING_MAX, RATING_MIN, VALIDATION_MESSAGES } from '@kim/shared';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Отзыв о качестве проведённого мероприятия — Задание 1, п. 3.
 *
 * Оценка — наша трактовка формулировки «отзыв о качестве» (ADR-0003).
 */
export class CreateReviewDto {
  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.ratingInvalid })
  @Min(RATING_MIN, { message: VALIDATION_MESSAGES.ratingInvalid })
  @Max(RATING_MAX, { message: VALIDATION_MESSAGES.ratingInvalid })
  rating: number;

  @IsString({ message: VALIDATION_MESSAGES.reviewTextRequired })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.reviewTextRequired })
  @MaxLength(2000, { message: VALIDATION_MESSAGES.reviewTextRequired })
  text: string;
}
