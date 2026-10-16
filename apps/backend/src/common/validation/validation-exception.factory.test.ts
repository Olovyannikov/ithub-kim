import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VALIDATION_MESSAGES, type ApiErrorResponse } from '@kim/shared';
import type { ValidationError } from '@nestjs/common';

import { validationExceptionFactory } from './validation-exception.factory';

function payloadFor(errors: ValidationError[]): ApiErrorResponse {
  return validationExceptionFactory(errors).getResponse() as ApiErrorResponse;
}

describe('validationExceptionFactory', () => {
  it('раскладывает ошибки по полям — иначе их не показать на форме', () => {
    const payload = payloadFor([
      { property: 'login', constraints: { matches: VALIDATION_MESSAGES.login } },
      { property: 'phone', constraints: { matches: VALIDATION_MESSAGES.phone } },
    ] as ValidationError[]);

    assert.equal(payload.statusCode, 400);
    assert.equal(payload.message, VALIDATION_MESSAGES.validationFailed);
    assert.deepEqual(payload.errors, {
      login: VALIDATION_MESSAGES.login,
      phone: VALIDATION_MESSAGES.phone,
    });
  });

  it('заменяет англоязычное сообщение whitelist на формулировку из @kim/shared', () => {
    const payload = payloadFor([
      { property: 'role', constraints: { whitelistValidation: 'property role should not exist' } },
    ] as ValidationError[]);

    assert.equal(payload.errors?.role, VALIDATION_MESSAGES.unexpectedField);
  });

  it('разворачивает вложенные поля через точку', () => {
    const payload = payloadFor([
      {
        property: 'review',
        children: [{ property: 'rating', constraints: { min: VALIDATION_MESSAGES.ratingInvalid } }],
      },
    ] as ValidationError[]);

    assert.equal(payload.errors?.['review.rating'], VALIDATION_MESSAGES.ratingInvalid);
  });
});
