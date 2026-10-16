import { VALIDATION_MESSAGES, type ApiErrorResponse } from '@kim/shared';
import { BadRequestException, type ValidationError } from '@nestjs/common';

/**
 * Превращает ошибки class-validator в ответ, разложенный по полям.
 *
 * Штатный ValidationPipe отдаёт плоский массив строк, по которому нельзя
 * понять, в каком поле ошибка. Задание 2 требует показывать ошибки на форме,
 * поэтому формат ответа — объект `errors` с одним сообщением на поле
 * (ADR-0005).
 */
export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const fields: Record<string, string> = {};

  const collect = (list: ValidationError[], prefix = ''): void => {
    for (const error of list) {
      const path = prefix ? `${prefix}.${error.property}` : error.property;
      // forbidNonWhitelisted формирует сообщение сам, по-английски
      // («property X should not exist»). Наружу такое отдавать нельзя:
      // все формулировки берутся из @kim/shared (ADR-0005).
      const constraints = error.constraints ?? {};
      const first =
        'whitelistValidation' in constraints
          ? VALIDATION_MESSAGES.unexpectedField
          : Object.values(constraints)[0];

      if (first && !(path in fields)) {
        fields[path] = first;
      }

      if (error.children?.length) {
        collect(error.children, path);
      }
    }
  };

  collect(errors);

  const payload: ApiErrorResponse = {
    statusCode: 400,
    message: VALIDATION_MESSAGES.validationFailed,
    errors: fields,
  };

  return new BadRequestException(payload);
}
