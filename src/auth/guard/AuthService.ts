import { EntityManager } from 'typeorm';

import { AccessObject, AccessObjectAction, Right, Role } from '../../libs/db/entity';

export class AuthService {
  constructor(private readonly manager: EntityManager) {}

  public async getUserRoles(): Promise<string[]> {
    // todo 1
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
      // todo 2
      .innerJoin('ActionApi', 'aa', 'aa.actionName = r.actionName')
      .innerJoin('Api', 'api', 'api.name = aa.apiName')
      .where('role.name in (:...roles)')
      .andWhere('api.name = :apiName')
      .setParameters({ roles, apiName });

    return qb.getExists();
  }
}
