import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Индекс под фильтр «начало конференции с… по…» в панели администратора
 * (Задание 2, п. 5).
 *
 * Замер на 40 000 заявок: выборка по диапазону шла последовательным просмотром
 * таблицы за 3.1–4.3 мс, с индексом — 0.09–0.45 мс.
 *
 * Триграммный индекс под поиск по заявителю (`ILIKE '%текст%'`) рассматривался
 * и **отвергнут по результатам замера**: на двух тысячах пользователей
 * PostgreSQL резонно предпочитает последовательный просмотр, и время запроса
 * не менялось. Такой индекс начал бы окупаться на десятках тысяч
 * пользователей — это не наш масштаб. Плюс `pg_trgm` специфичен для
 * PostgreSQL и мешал бы плану отхода на MySQL из ADR-0001.
 */
export class AddFilterIndexes1792413916204 implements MigrationInterface {
  name = 'AddFilterIndexes1792413916204';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "applications_starts_at_idx" ON "applications"  ("starts_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."applications_starts_at_idx"`);
  }
}
