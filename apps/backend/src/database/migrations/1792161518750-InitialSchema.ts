import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class InitialSchema1792161518750 implements MigrationInterface {
  name = 'InitialSchema1792161518750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "application_id" integer NOT NULL, "rating" smallint NOT NULL, "text" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_414daf69b1c74f190324c9069a" UNIQUE ("application_id"), CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "rooms" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "kind" character varying(32) NOT NULL, "capacity" integer, "description" text, "image_url" character varying(512), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "rooms_kind_check" CHECK ("kind" IN ('Аудитория', 'Коворкинг', 'Кинозал')), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "login" character varying(64) NOT NULL, "password_hash" character varying(255) NOT NULL, "full_name" character varying(255) NOT NULL, "phone" character varying(15) NOT NULL, "email" character varying(255) NOT NULL, "role" character varying(16) NOT NULL DEFAULT 'user', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login"), CONSTRAINT "users_role_check" CHECK ("role" IN ('user', 'admin')), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "applications" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "room_id" integer NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "payment_method" character varying(32) NOT NULL, "status" character varying(32) NOT NULL DEFAULT 'Новая', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "applications_payment_method_check" CHECK ("payment_method" IN ('При очном посещении', 'Переводом по системе СБП')), CONSTRAINT "applications_status_check" CHECK ("status" IN ('Новая', 'Мероприятие назначено', 'Завершено')), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "applications_user_id_idx" ON "applications"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "applications_room_id_idx" ON "applications"  ("room_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "applications_status_idx" ON "applications"  ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_414daf69b1c74f190324c9069ac" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_9e7594d5b474d9cbebba15c1ae7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_12cafc0c7df7191264372a7d910" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_12cafc0c7df7191264372a7d910"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_9e7594d5b474d9cbebba15c1ae7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_414daf69b1c74f190324c9069ac"`,
    );
    await queryRunner.query(`DROP INDEX "public"."applications_status_idx"`);
    await queryRunner.query(`DROP INDEX "public"."applications_room_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."applications_user_id_idx"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
  }
}
