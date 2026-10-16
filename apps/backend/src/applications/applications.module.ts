import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewEntity } from '../reviews/review.entity';
import { RoomEntity } from '../rooms/room.entity';
import { RoomsModule } from '../rooms/rooms.module';
import { ApplicationEntity } from './application.entity';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity, RoomEntity, ReviewEntity]), RoomsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
