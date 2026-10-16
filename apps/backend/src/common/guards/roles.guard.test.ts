import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { UserRole } from '@kim/shared';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

function contextWith(role: UserRole | undefined): ExecutionContext {
  const request = role ? { user: { role } } : {};

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function guardFor(required: UserRole[] | undefined): RolesGuard {
  const reflector = new Reflector();

  reflector.getAllAndOverride = (() => required) as Reflector['getAllAndOverride'];

  return new RolesGuard(reflector);
}

describe('RolesGuard — доступ в панель администратора', () => {
  it('пропускает эндпоинты без требований к роли', () => {
    assert.equal(guardFor(undefined).canActivate(contextWith('user')), true);
    assert.equal(guardFor([]).canActivate(contextWith(undefined)), true);
  });

  it('пропускает администратора', () => {
    assert.equal(guardFor(['admin']).canActivate(contextWith('admin')), true);
  });

  it('не пропускает обычного пользователя в админские эндпоинты', () => {
    assert.throws(() => guardFor(['admin']).canActivate(contextWith('user')), ForbiddenException);
  });

  it('не пропускает запрос без пользователя', () => {
    assert.throws(
      () => guardFor(['admin']).canActivate(contextWith(undefined)),
      ForbiddenException,
    );
  });
});
