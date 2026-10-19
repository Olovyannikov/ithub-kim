import {
  EMAIL_PATTERN,
  FULL_NAME_PATTERN,
  LOGIN_PATTERN,
  PASSWORD_MIN_LENGTH,
  PHONE_PATTERN,
  RATING_MAX,
  RATING_MIN,
  VALIDATION_MESSAGES,
} from '@kim/shared';

/**
 * Валидаторы для @mantine/form, собранные из правил `@kim/shared`.
 *
 * В компонентах не должно быть ни одного регулярного выражения и ни одной
 * формулировки ошибки — только эти функции (ADR-0005, ADR-0007).
 */
type Validator<T = string> = (value: T) => string | null;

const required =
  <T>(message: string, validator?: Validator<T>): Validator<T> =>
  (value) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }

    return validator ? validator(value) : null;
  };

export const validators = {
  /** Логин: латиница и цифры, не менее 6 символов. */
  login: required<string>(VALIDATION_MESSAGES.required, (value) =>
    LOGIN_PATTERN.test(value) ? null : VALIDATION_MESSAGES.login,
  ),

  /** Пароль: минимум 8 символов. */
  password: required<string>(VALIDATION_MESSAGES.required, (value) =>
    value.length >= PASSWORD_MIN_LENGTH ? null : VALIDATION_MESSAGES.password,
  ),

  /** ФИО: символы кириллицы и пробелы. */
  fullName: required<string>(VALIDATION_MESSAGES.required, (value) =>
    FULL_NAME_PATTERN.test(value) ? null : VALIDATION_MESSAGES.fullName,
  ),

  /** Телефон строго в формате 8(XXX)XXX-XX-XX. */
  phone: required<string>(VALIDATION_MESSAGES.required, (value) =>
    PHONE_PATTERN.test(value) ? null : VALIDATION_MESSAGES.phone,
  ),

  email: required<string>(VALIDATION_MESSAGES.required, (value) =>
    EMAIL_PATTERN.test(value) ? null : VALIDATION_MESSAGES.email,
  ),

  /** На форме входа формат не проверяем — см. ADR-0004. */
  notEmpty: required<string>(VALIDATION_MESSAGES.required),

  room: required<string | number | null>(VALIDATION_MESSAGES.roomRequired),

  paymentMethod: required<string | null>(VALIDATION_MESSAGES.paymentMethodRequired),

  startsAt: required<Date | string | null>(VALIDATION_MESSAGES.startsAtRequired, (value) => {
    // `required` уже отсёк пустое значение, но TypeScript об этом не знает.
    const date = value instanceof Date ? value : new Date(value ?? '');

    if (Number.isNaN(date.getTime())) {
      return VALIDATION_MESSAGES.startsAtInvalid;
    }

    return date.getTime() < Date.now() ? VALIDATION_MESSAGES.startsAtPast : null;
  }),

  rating: required<number | null>(VALIDATION_MESSAGES.ratingInvalid, (value) =>
    Number.isInteger(value) && (value as number) >= RATING_MIN && (value as number) <= RATING_MAX
      ? null
      : VALIDATION_MESSAGES.ratingInvalid,
  ),

  reviewText: required<string>(VALIDATION_MESSAGES.reviewTextRequired),
};
