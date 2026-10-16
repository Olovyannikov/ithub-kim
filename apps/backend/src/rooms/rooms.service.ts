import type { RoomDto } from '@kim/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RoomEntity } from './room.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly rooms: Repository<RoomEntity>,
  ) {}

  /** Справочник для выпадающего списка в форме заявки (Задание 2, п. 4). */
  async findAll(): Promise<RoomDto[]> {
    const rooms = await this.rooms.find({ order: { kind: 'ASC', name: 'ASC' } });

    return rooms.map((room) => RoomsService.toDto(room));
  }

  static toDto(room: RoomEntity): RoomDto {
    return {
      id: room.id,
      name: room.name,
      kind: room.kind,
      capacity: room.capacity,
      description: room.description,
      imageUrl: room.imageUrl,
    };
  }
}
