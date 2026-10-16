import { Controller, Get } from '@nestjs/common';
import { APPLICATION_STATUSES, ROOM_KINDS } from '@kim/shared';

/**
 * Проверочный эндпоинт каркаса: подтверждает, что приложение поднимается
 * и что общий пакет @kim/shared подключён корректно.
 * Будет заменён реальными модулями в Части 2.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): {
    status: string;
    roomKinds: readonly string[];
    applicationStatuses: readonly string[];
  } {
    return {
      status: 'ok',
      roomKinds: ROOM_KINDS,
      applicationStatuses: APPLICATION_STATUSES,
    };
  }
}
