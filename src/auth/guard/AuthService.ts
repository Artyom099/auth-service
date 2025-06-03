import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import {
  AccessObject,
  AccessObjectAction,
  ActionApi,
  Api,
  Right,
  Role,
  RoleHierarchy,
  User,
  UserRole,
} from '../../libs/db/entity';

@Injectable()
export class AuthService {
  constructor(private readonly manager: EntityManager) {}

  /**
   * Получение всех ролей, которые доступны пользователю
   */
  public async getUserRoles(userId: string): Promise<string[]> {
    const rolesCte = [
      this.manager
        .createQueryBuilder()
        .select('r.name', 'name')
        .addSelect('h.parentName', 'parentName')
        .from(Role, 'r')
        .leftJoin(RoleHierarchy, 'h', 'h.name = r.name')
        .leftJoin(UserRole, 'ur', 'ur.roleName = r.name')
        .leftJoin(User, 'u', 'u.id = ur.userId')
        .where('u.id = :userId'),

      this.manager
        .createQueryBuilder()
        .select('r.name', 'name')
        .addSelect('h.parentName', 'parentName')
        .from(Role, 'r')
        .leftJoin(RoleHierarchy, 'h', 'h.name = r.name')
        .innerJoin('roles', 'roles', '"roles"."parentName" = r.name'),
    ]
      .map((qb) => qb.getQuery())
      .join(' union all ');

    const qb = this.manager
      .createQueryBuilder()
      .select('roles.name', 'name')
      .from('roles', 'roles')
      .addCommonTableExpression(rolesCte, 'roles', {
        recursive: true,
        columnNames: ['name', 'parentName'],
      })
      .setParameters({ userId });

    console.log({ sql: qb.getQueryAndParameters() });

    const userRoles = await qb.getRawMany<{ name: string; parentName: string }>();
    console.log({ userRoles });

    const roles = userRoles.map((role) => role.name);

    return ['admin'];
  }

  /**
   * Есть ли у пользователя право на эту апи
   */
  public async isAccessGranted(roles: string[], apiName: string): Promise<boolean> {
    const qb = this.manager
      .createQueryBuilder()
      .from(Role, 'role')
      .innerJoin(Right, 'r', 'role.name = r.roleName')
      .innerJoin(AccessObjectAction, 'aoa', 'aoa.actionName = r.actionName')
      .innerJoin(AccessObject, 'ao', 'ao.name = aoa.objectName')
      .innerJoin(ActionApi, 'aa', 'aa.actionName = r.actionName')
      .innerJoin(Api, 'api', 'api.name = aa.apiName')
      .where('role.name in (:...roles)')
      .andWhere('api.name = :apiName')
      .setParameters({ roles, apiName });

    return qb.getExists();
  }
}
