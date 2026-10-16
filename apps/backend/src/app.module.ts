import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { RoomEntity } from './rooms/room.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([RoomEntity]),
  ],
  controllers: [HealthController],
})
export class AppModule {}
