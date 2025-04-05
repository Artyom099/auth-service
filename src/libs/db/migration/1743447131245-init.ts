import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1743447131245 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Проверка наличия функции uuid_generate_v4
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Создание таблицы user
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
        "login" VARCHAR(50) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "created_at" DATE NOT NULL,
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_login" UNIQUE ("login"),
        CONSTRAINT "UQ_user_password_hash" UNIQUE ("password_hash")
      )
    `);

    // Создание таблицы device
    await queryRunner.query(`
      CREATE TABLE "device" (
        "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
        "ip" VARCHAR NOT NULL,
        "device_name" VARCHAR NOT NULL,
        "issued_at" TIMESTAMP NOT NULL,
        "userId" UUID,
        CONSTRAINT "PK_device_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_device_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // Создание таблицы user_password_recovery
    await queryRunner.query(`
      CREATE TABLE "user_password_recovery" (
        "recovery_code" VARCHAR(50) NOT NULL,
        "expiration_date" DATE NOT NULL,
        "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
        "userId" UUID NOT NULL,
        CONSTRAINT "UQ_user_password_recovery_recovery_code" UNIQUE ("recovery_code"),
        CONSTRAINT "REL_user_password_recovery_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_user_password_recovery_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    // Создание таблицы user_email_confirmation
    await queryRunner.query(`
      CREATE TABLE "user_email_confirmation" (
        "confirmation_code" VARCHAR(50) NOT NULL,
        "expiration_date" DATE NOT NULL,
        "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
        "email" VARCHAR(50) NOT NULL,
        "userId" UUID NOT NULL,
        CONSTRAINT "UQ_user_email_confirmation_confirmation_code" UNIQUE ("confirmation_code"),
        CONSTRAINT "UQ_user_email_confirmation_email" UNIQUE ("email"),
        CONSTRAINT "REL_user_email_confirmation_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_user_email_confirmation_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаление таблицы user_email_confirmation
    await queryRunner.query('DROP TABLE IF EXISTS user_email_confirmation CASCADE');
    // Удаление таблицы user_password_recovery
    await queryRunner.query('DROP TABLE IF EXISTS user_password_recovery CASCADE');
    // Удаление таблицы device
    await queryRunner.query('DROP TABLE IF EXISTS device CASCADE');
    // Удаление таблицы user
    await queryRunner.query('DROP TABLE IF EXISTS user CASCADE');
  }
}
