import { MigrationInterface, QueryRunner } from 'typeorm';

import {
  AccessObject,
  AccessObjectAction,
  Action,
  ActionApi,
  Api,
  EAccessObjectType,
  EActionType,
  IAccessObject,
  IAccessObjectAction,
  IAction,
  IActionApi,
  IApi,
  IRight,
  IRole,
  IRoleHierarchy,
  Right,
  Role,
  RoleHierarchy,
  UserRole,
} from '../entity';

export class FillAccessTables1710000000000 implements MigrationInterface {
  /**
   * authService
   * |__profile
   * |  |__updatePassword
   * |
   * |__device
   * |  |__deleteDevice
   * |
   * |__role
   * |  |__createRole
   * |
   * |__accessObject
   * |  |__grantRevokeAccess
   * |
   * |__users
   *    |__assignRole
   */
  private readonly objects: { [key: string]: IAccessObject } = {
    // текущий сервис
    authService: { name: 'auth-service', type: EAccessObjectType.APP },

    // вкладки текущего сервиса
    profile: { name: 'profile', type: EAccessObjectType.TAB, parentName: 'auth-service' },
    device: { name: 'device', type: EAccessObjectType.TAB, parentName: 'auth-service' },
    role: { name: 'role', type: EAccessObjectType.TAB, parentName: 'auth-service' },
    accessObject: { name: 'access_object', type: EAccessObjectType.TAB, parentName: 'auth-service' },
    users: { name: 'users', type: EAccessObjectType.TAB, parentName: 'auth-service' },

    // кнопки текущего сервиса
    grantRevokeAccess: { name: 'grant_revoke_access', type: EAccessObjectType.BUTTON, parentName: 'access_object' },
    deleteDevice: { name: 'delete_device', type: EAccessObjectType.BUTTON, parentName: 'device' },
    updatePassword: { name: 'update_password', type: EAccessObjectType.BUTTON, parentName: 'profile' },
    createRole: { name: 'create_role', type: EAccessObjectType.BUTTON, parentName: 'role' },
    assignRole: { name: 'assign_role', type: EAccessObjectType.BUTTON, parentName: 'users' },

    // другие сервисы
    storageService: { name: 'storage-service', type: EAccessObjectType.APP },
    paymentService: { name: 'payment-service', type: EAccessObjectType.APP },
  };

  // можем ли выдать доступ на весь сервис? - нет, только на его бизнес-действия
  private readonly action: { [key: string]: IAction } = {
    readDevice: { name: 'read_device', type: EActionType.READ, description: 'Чтение вкладки Устройства' },
    deleteDevice: { name: 'delete_device', type: EActionType.WRITE, description: 'Удаление сессий пользователя' },
    readRoles: { name: 'read_roles', type: EActionType.READ, description: 'Чтени вкладки Роли' },
    createRoles: { name: 'create_roles', type: EActionType.WRITE, description: 'Создание ролей' },
    grantAccess: { name: 'grant_access', type: EActionType.SPECIAL, description: 'Выдача и отзыв прав роли' },
    readProfile: { name: 'read_profile', type: EActionType.READ, description: 'Чтение вкладки Профиль' },
    updatePassword: { name: 'update_password', type: EActionType.WRITE, description: 'Обновление пароля' },
    assignRole: { name: 'assign_role', type: EActionType.SPECIAL, description: 'Выдача роли пользователю' },
    getUsers: { name: 'get_users', type: EActionType.READ, description: 'Чтение пользователей' },
    readCalculateRights: { name: 'read_calc_rights', type: EActionType.READ, description: 'Чтение дерева доступов' },
  };

  /**
   * admin
   * user
   * |__engineer
   *    |__sys_admin
   *    |__manager
   *       |__moderator
   */
  private readonly role: { [key: string]: IRole } = {
    admin: { name: 'admin', description: 'Имеет доступ ко всем компонентам' },
    moderator: { name: 'moderator', description: 'Модерирует систему' },
    engineer: { name: 'engineer', description: 'Имеет доступ только к сервису авторизации' },
    manager: { name: 'manager', description: 'Имеет доступ ко всему только на чтение' },
    user: { name: 'user', description: 'Имеет динамичский доступ' },
    sysAdmin: { name: 'sys_admin', description: 'Имеет динамичский доступ' },
    dba: { name: 'dba', description: 'Доступ к базе данных' },
  };

  private readonly hierarchy: IRoleHierarchy[] = [
    { name: this.role.engineer.name, parentName: this.role.user.name },
    { name: this.role.manager.name, parentName: this.role.engineer.name },
    { name: this.role.sysAdmin.name, parentName: this.role.engineer.name },
    { name: this.role.moderator.name, parentName: this.role.manager.name },
    { name: this.role.dba.name, parentName: this.role.sysAdmin.name },
  ];

  // todo - связь объекта и бизнес-действия
  /**
   * --- action -> accessObject ---
   *
   * readProfile -> profile
   * updatePassword -> updatePassword
   *
   * readDevice -> device
   * deleteDevice -> deleteDevice
   *
   * readRoles -> role
   * createRoles -> createRole
   * grantAccess -> grantRevokeAccess
   * assignRole -> assignRole
   * getUsers -> user
   * accessObject -> readCalculateRights
   */
  private readonly objectActions: IAccessObjectAction[] = [
    { objectName: this.objects.device.name, actionName: this.action.readDevice.name },
    { objectName: this.objects.deleteDevice.name, actionName: this.action.deleteDevice.name },
    { objectName: this.objects.grantRevokeAccess.name, actionName: this.action.grantAccess.name },
    { objectName: this.objects.profile.name, actionName: this.action.readProfile.name },
    { objectName: this.objects.updatePassword.name, actionName: this.action.updatePassword.name },
    { objectName: this.objects.role.name, actionName: this.action.readRoles.name },
    { objectName: this.objects.assignRole.name, actionName: this.action.assignRole.name },
    { objectName: this.objects.users.name, actionName: this.action.getUsers.name },
    { objectName: this.objects.accessObject.name, actionName: this.action.readCalculateRights.name },
  ];

  // todo - права роли
  private readonly rights: IRight[] = [
    { roleName: this.role.admin.name, actionName: this.action.readProfile.name },
    { roleName: this.role.admin.name, actionName: this.action.readDevice.name },
    { roleName: this.role.admin.name, actionName: this.action.deleteDevice.name },
    { roleName: this.role.admin.name, actionName: this.action.grantAccess.name },
    { roleName: this.role.admin.name, actionName: this.action.updatePassword.name },
    { roleName: this.role.admin.name, actionName: this.action.readRoles.name },
    { roleName: this.role.admin.name, actionName: this.action.createRoles.name },
    { roleName: this.role.admin.name, actionName: this.action.assignRole.name },
    { roleName: this.role.admin.name, actionName: this.action.getUsers.name },
    { roleName: this.role.admin.name, actionName: this.action.readCalculateRights.name },

    { roleName: this.role.user.name, actionName: this.action.readDevice.name },
    { roleName: this.role.user.name, actionName: this.action.deleteDevice.name },
    { roleName: this.role.user.name, actionName: this.action.readProfile.name },
    { roleName: this.role.user.name, actionName: this.action.updatePassword.name },
  ];

  // todo - литералы апи - controller/entity/method
  private readonly api: { [key: string]: IApi } = {
    roleFlat: { name: 'admin/roles' },
    roleTree: { name: 'admin/roles/get_tree' },
    roleCreate: { name: 'admin/roles/create' },
    getDevices: { name: 'device' },
    deleteDevice: { name: 'device/delete' },
    deleteOtherDevices: { name: 'device/delete_other' },
    readProfile: { name: 'auth/me' },
    updatePassword: { name: 'auth/update-password' },
    passwordRecovery: { name: 'auth/password-recovery' },
    reassignRight: { name: 'admin/right/reassign' },
    calculateRights: { name: 'admin/access_object/calculate_rights' },
    userRoleCreate: { name: 'admin/user_role/create' },
    getUsers: { name: 'admin/user/get_list' },
  };

  // todo - связи апи и бизнес-действия
  /**
   * --- action -> api ---
   *
   * readProfile -> readProfile
   * updatePassword -> updatePassword, passwordRecovery
   *
   * readDevice -> getDevices
   * deleteDevice -> deleteDevice, deleteOtherDevices
   *
   * readRoles -> roleFlat, roleTree
   * createRoles -> roleCreate
   * grantAccess -> reassignRight, calculateRights
   * assignRole -> userRoleCreate
   * getUsers -> getUsers
   * readCalculateRights -> calculateRights
   */
  private readonly actionApis: IActionApi[] = [
    // профиль
    { actionName: this.action.readProfile.name, apiName: this.api.readProfile.name },
    { actionName: this.action.updatePassword.name, apiName: this.api.updatePassword.name },
    { actionName: this.action.updatePassword.name, apiName: this.api.passwordRecovery.name },

    // девайсы
    { actionName: this.action.readDevice.name, apiName: this.api.getDevices.name },
    { actionName: this.action.deleteDevice.name, apiName: this.api.deleteDevice.name },
    { actionName: this.action.deleteDevice.name, apiName: this.api.deleteOtherDevices.name },

    // роли и права
    { actionName: this.action.readRoles.name, apiName: this.api.roleFlat.name },
    { actionName: this.action.readRoles.name, apiName: this.api.roleTree.name },
    { actionName: this.action.createRoles.name, apiName: this.api.roleCreate.name },
    { actionName: this.action.grantAccess.name, apiName: this.api.calculateRights.name },
    { actionName: this.action.grantAccess.name, apiName: this.api.reassignRight.name },
    { actionName: this.action.assignRole.name, apiName: this.api.userRoleCreate.name },
    { actionName: this.action.getUsers.name, apiName: this.api.getUsers.name },
    { actionName: this.action.readCalculateRights.name, apiName: this.api.calculateRights.name },
  ];

  private readonly adminUserId = '688987db-6d1d-4d83-9934-fd0b23a09789';
  private readonly userUserId = '9e4d9b7d-fab1-47ec-8e18-bd7f4b191b06';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const accessObject of Object.values(this.objects)) {
      await queryRunner.manager.getRepository(AccessObject).insert(accessObject);
    }
    for (const action of Object.values(this.action)) {
      await queryRunner.manager.getRepository(Action).insert(action);
    }
    for (const role of Object.values(this.role)) {
      await queryRunner.manager.getRepository(Role).insert(role);
    }
    for (const api of Object.values(this.api)) {
      await queryRunner.manager.getRepository(Api).insert(api);
    }

    // создание связей
    await queryRunner.manager.getRepository(AccessObjectAction).insert(this.objectActions);
    await queryRunner.manager.getRepository(Right).insert(this.rights);
    await queryRunner.manager.getRepository(ActionApi).insert(this.actionApis);
    await queryRunner.manager.getRepository(RoleHierarchy).insert(this.hierarchy);

    const userRoleRepo = queryRunner.manager.getRepository(UserRole);

    await userRoleRepo.insert({ userId: this.adminUserId, roleName: this.role.admin.name });
    await userRoleRepo.insert({ userId: this.userUserId, roleName: this.role.user.name });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.getRepository(Right).delete({});
    await queryRunner.manager.getRepository(UserRole).delete({});

    // удаление связей
    for (const actionApi of this.actionApis) {
      await queryRunner.manager.getRepository(ActionApi).delete(actionApi);
    }
    for (const objectAction of this.objectActions) {
      await queryRunner.manager.getRepository(AccessObjectAction).delete(objectAction);
    }
    for (const right of this.rights) {
      await queryRunner.manager.getRepository(Right).delete(right);
    }
    for (const hierarchy of this.hierarchy) {
      await queryRunner.manager.getRepository(RoleHierarchy).delete(hierarchy);
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
    for (const api of Object.values(this.api)) {
      await queryRunner.manager.getRepository(Api).delete(api);
    }
  }
}
