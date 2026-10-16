import type { RoomDto } from '@kim/shared';
import { Controller, Get } from '@nestjs/common';

import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  findAll(): Promise<RoomDto[]> {
    return this.rooms.findAll();
  }
}
