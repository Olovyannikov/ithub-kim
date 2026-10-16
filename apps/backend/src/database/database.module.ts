import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { dataSourceOptions } from './data-source.options';

/**
 * Подключение к базе данных. Настройки берутся из того же файла, что использует
 * CLI миграций, — чтобы приложение и миграции не могли разойтись.
 */
@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
})
export class DatabaseModule {}
