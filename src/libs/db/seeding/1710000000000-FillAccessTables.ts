import { MigrationInterface, QueryRunner } from 'typeorm';

import {
  AccessObject,
  AccessObjectAction,
  Action,
  EAccessObjectType,
  EActionType,
  IAccessObject,
  IAccessObjectAction,
  IAction,
  IRight,
  IRole,
  Right,
  Role,
} from '../entity';

export class FillAccessTables1710000000000 implements MigrationInterface {
  private readonly objects: { [key: string]: IAccessObject } = {
    // текущий сервис
    authService: { name: 'auth-service', type: EAccessObjectType.APP },

    // вкладки текущего сервиса
    device: { name: 'device', type: EAccessObjectType.TAB, parentName: 'auth-service' },
    role: { name: 'role', type: EAccessObjectType.TAB, parentName: 'auth-service' },
    right: { name: 'right', type: EAccessObjectType.TAB, parentName: 'auth-service' },
    service: { name: 'service', type: EAccessObjectType.TAB, parentName: 'auth-service' },

    // кнопки текущего сервиса
    grantRevokeAccess: { name: 'grant_revoke_access', type: EAccessObjectType.BUTTON, parentName: 'right' },
    deleteDevice: { name: 'delete_device', type: EAccessObjectType.BUTTON, parentName: 'device' },

    // другие сервисы
    storageService: { name: 'storage-service', type: EAccessObjectType.APP },
    paymentService: { name: 'payment-service', type: EAccessObjectType.APP },
  };

  // можем ли выдать доступ на весь сервис? - скорее нет
  private readonly action: { [key: string]: IAction } = {
    readDevice: { name: 'read_device', type: EActionType.READ },
    deleteDevice: { name: 'delete_device', type: EActionType.WRITE },
  };

  private readonly role: { [key: string]: IRole } = {
    admin: { name: 'admin', description: 'Имеет доступ ко всем компонентам системы' },
    moderator: { name: 'moderator', description: '' },
    engineer: { name: 'engineer', description: 'Имеет доступ только к сервису авторизации' },
    manager: { name: 'manager', description: 'Имеет доступ ко всему только на чтение' },
    user: { name: 'user', description: 'Имеет доступ к паре вкладок и только на чтение' },
  };

  // todo
  private readonly objectActions: IAccessObjectAction[] = [
    { objectName: this.objects.device.name, actionName: this.action.readDevice.name },
  ];

  // todo
  private readonly rights: IRight[] = [
    { roleName: this.role.admin.name, actionName: this.action.readDevice.name },
    { roleName: this.role.admin.name, actionName: this.action.deleteDevice.name },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Заполняем таблицу AccessObject (объекты доступа)
    for (const accessObject of Object.values(this.objects)) {
      await queryRunner.manager.getRepository(AccessObject).insert(accessObject);
    }

    // Заполняем таблицу Action (действия)
    for (const action of Object.values(this.action)) {
      await queryRunner.manager.getRepository(Action).insert(action);
    }

    // Заполняем таблицу Role (роли)
    for (const role of Object.values(this.role)) {
      await queryRunner.manager.getRepository(Role).insert(role);
    }

    // Заполняем таблицу AccessObjectAction (связь объектов и действий)
    for (const objectAction of this.objectActions) {
      await queryRunner.manager.getRepository(AccessObjectAction).insert(objectAction);
    }

    // Заполняем таблицу Right (права)
    for (const right of this.rights) {
      await queryRunner.manager.getRepository(Right).insert(right);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // удаление связей
    for (const objectAction of this.objectActions) {
      await queryRunner.manager.getRepository(AccessObjectAction).delete(objectAction);
    }
    for (const right of this.rights) {
      await queryRunner.manager.getRepository(Right).delete(right);
    }

    // удаление сущностей
    for (const accessObject of Object.values(this.objects)) {
      await queryRunner.manager.getRepository(AccessObject).delete(accessObject);
    }

    for (const action of Object.values(this.action)) {
      await queryRunner.manager.getRepository(Action).delete(action);
    }

    for (const role of Object.values(this.role)) {
      await queryRunner.manager.getRepository(Role).delete(role);
    }
  }
}
