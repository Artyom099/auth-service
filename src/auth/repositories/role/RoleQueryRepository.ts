import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Role, RoleHierarchy } from '../../../libs/db/entity';
import { RoleGetTreeRequestDto, RoleGetTreeResponseDto } from '../../../libs/dto';

@Injectable()
export class RoleQueryRepository {
  constructor(private manager: EntityManager) {}

  async getRoles(): Promise<Role[]> {
    return this.manager.find(Role);
  }

  async getRolesTree(dto: RoleGetTreeRequestDto): Promise<RoleGetTreeResponseDto[]> {
    const { name } = dto;

    const rolesCte = [
      this.manager
        .createQueryBuilder()
        .select('r.name', 'name')
        .addSelect('h.parentName', 'parentName')
        .from(Role, 'r')
        .leftJoin(RoleHierarchy, 'h', 'h.name = r.name')
        .where('r.name = :name'),

      this.manager
        .createQueryBuilder()
        .select('r.name', 'name')
        .addSelect('h.parentName', 'parentName')
        .from(Role, 'r')
        .leftJoin(RoleHierarchy, 'h', 'h.name = r.name')
        .innerJoin('roles', 'roles', '"roles"."name" = h.parentName'), // идем вниз по дереву
    ]
      .map((qb) => qb.getQuery())
      .join(' union all ');

    const qb = this.manager
      .createQueryBuilder()
      .select('roles.name', 'name')
      .addSelect('roles."parentName"', 'parentName')
      .from('roles', 'roles')
      .addCommonTableExpression(rolesCte, 'roles', {
        recursive: true,
        columnNames: ['name', 'parentName'],
      })
      .setParameters({ name });

    return qb.getRawMany<{ name: string; parentName: string }>();
  }
}
