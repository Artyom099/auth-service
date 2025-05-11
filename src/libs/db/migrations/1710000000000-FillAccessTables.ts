import { MigrationInterface, QueryRunner } from 'typeorm';

export class FillAccessTables1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Заполняем таблицу AccessObject (объекты доступа)
    await queryRunner.query(`
      INSERT INTO access_object (name, type, parent_name) VALUES
      ('users', 'module', NULL),
      ('devices', 'module', NULL),
      ('roles', 'module', NULL),
      ('user', 'entity', 'users'),
      ('device', 'entity', 'devices'),
      ('role', 'entity', 'roles')
    `);

    // Заполняем таблицу Action (действия)
    await queryRunner.query(`
      INSERT INTO action (name, type) VALUES
      ('create', 'write'),
      ('read', 'read'),
      ('update', 'write'),
      ('delete', 'write'),
      ('manage', 'admin')
    `);

    // Заполняем таблицу AccessObjectAction (связь объектов и действий)
    await queryRunner.query(`
      INSERT INTO access_object_action (object_name, action_name) VALUES
      ('user', 'create'),
      ('user', 'read'),
      ('user', 'update'),
      ('user', 'delete'),
      ('user', 'manage'),
      ('device', 'create'),
      ('device', 'read'),
      ('device', 'update'),
      ('device', 'delete'),
      ('device', 'manage'),
      ('role', 'create'),
      ('role', 'read'),
      ('role', 'update'),
      ('role', 'delete'),
      ('role', 'manage')
    `);

    // Заполняем таблицу Role (роли)
    await queryRunner.query(`
      INSERT INTO role (name, description) VALUES
      ('admin', 'Администратор системы'),
      ('user', 'Пользователь'),
      ('moderator', 'Модератор')
    `);

    // Заполняем таблицу Right (права)
    await queryRunner.query(`
      INSERT INTO right (action_name, role_name) VALUES
      -- Права администратора
      ('manage', 'admin'),
      ('create', 'admin'),
      ('read', 'admin'),
      ('update', 'admin'),
      ('delete', 'admin'),
      -- Права модератора
      ('read', 'moderator'),
      ('update', 'moderator'),
      -- Права пользователя
      ('read', 'user'),
      ('create', 'user'),
      ('update', 'user')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем данные в обратном порядке
    await queryRunner.query(`DELETE FROM right`);
    await queryRunner.query(`DELETE FROM role`);
    await queryRunner.query(`DELETE FROM access_object_action`);
    await queryRunner.query(`DELETE FROM action`);
    await queryRunner.query(`DELETE FROM access_object`);
  }
}
