import { APPLICATION_STATUSES, ROOM_KINDS } from '@kim/shared';
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RoomEntity } from './rooms/room.entity';

interface HealthResponse {
  status: string;
  database: 'ok' | 'unavailable';
  roomsInDatabase: number | null;
  roomKinds: readonly string[];
  applicationStatuses: readonly string[];
}

/**
 * Проверочный эндпоинт каркаса: подтверждает, что приложение поднимается,
 * что подключён общий пакет @kim/shared и что база данных доступна.
 * Будет заменён реальными модулями в Части 2.
 */
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly rooms: Repository<RoomEntity>,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    try {
      const roomsInDatabase = await this.rooms.count();

      return {
        status: 'ok',
        database: 'ok',
        roomsInDatabase,
        roomKinds: ROOM_KINDS,
        applicationStatuses: APPLICATION_STATUSES,
      };
    } catch {
      return {
        status: 'degraded',
        database: 'unavailable',
        roomsInDatabase: null,
        roomKinds: ROOM_KINDS,
        applicationStatuses: APPLICATION_STATUSES,
      };
    }
  }
}
