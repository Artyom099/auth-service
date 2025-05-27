import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { AccessObject, AccessObjectAction, Action, Right, Role } from '../../../libs/db/entity';
import { AccessObjectCalculateRightsRequestDto } from '../../../libs/dto';
import { AccessObjectNodeResponseDto } from '../../../libs/dto/output/AccessObjectNodeResponseDto';
import { flatToNestedTree, TFlatTreeItem } from '../../../libs/utils';

@Injectable()
export class AccessObjectQueryRepository {
  constructor(private manager: EntityManager) {}

  /**
   * Список всех объектов доступа системы
   */
  public async getAccessObjects(): Promise<AccessObject[]> {
    return this.manager.find(AccessObject);
  }

  /**
   * Запрос есть в обсидиане todo
   * Так же надо будет сделать функцию flatToNestedTree
   */
  public async calculateRightTree(dto: AccessObjectCalculateRightsRequestDto): Promise<any> {
    const { roleName } = dto;

    const rolesCte = [
      this.manager
        .createQueryBuilder()
        .select('r.name', 'name')
        .addSelect('r.status', 'status')
        .addSelect('r.parentName', 'parentName')
        .from(Role, 'r')
        .leftJoin('RoleHierarchy', 'h', 'h.name = r.name')
        .where('r.name = :roleName'),

      this.manager
        .createQueryBuilder()
        .select('r.name', 'name')
        .addSelect('r.status', 'status')
        .addSelect('r.parentName', 'parentName')
        .from(Role, 'r')
        .leftJoin('RoleHierarchy', 'h', 'h.name = r.name')
        .innerJoin('roles', 'roles', '"roles"."parentName" = r.name'),
    ]
      .map((qb) => qb.getQuery())
      .join(' union all ');

    const accessObjectsCte = [
      this.manager
        .createQueryBuilder()
        .select(['o.name as "objectName', 'o.parentName as "objectParentName', 'o.type as "objectType'])
        .from(AccessObject, 'o')
        .where('o.parentName is null'),

      this.manager
        .createQueryBuilder()
        .select(['o.name as "objectName', 'o.parentName as "objectParentName', 'o.type as "objectType'])
        .from('access_objects', 'access_objects')
        .innerJoin(AccessObject, 'o', 'o.parentName = access_objects."objectName"'),
    ]
      .map((qb) => qb.getQuery())
      .join(' union all ');

    const owmGrantSub = this.manager
      .createQueryBuilder()
      .select('true')
      .from(Right, 'r')
      .where('r.actionName = action.name')
      .andWhere('r.roleName = :roleName')
      .andWhere((qb1) => {
        const sub1 = qb1
          .subQuery()
          .select('roles."name"')
          .from('roles', 'roles')
          .where('roles.name = :roleName')
          .getQuery();

        return `r.roleName in ${sub1}}`;
      })
      .getQuery();

    const parentGrantSub = this.manager
      .createQueryBuilder()
      .select('true')
      .from(Right, 'r')
      .where('r.actionName = action.name')
      .andWhere((qb1) => {
        const sub1 = qb1
          .subQuery()
          .select('roles."name"')
          .from('roles', 'roles')
          .where('roles.name <> :roleName')
          .getQuery();

        return `r.roleName in ${sub1}}`;
      })
      .limit(1)
      .getQuery();

    const roleActionsCte = this.manager
      .createQueryBuilder()
      .select([
        'action.name as "actionName',
        'action.type as "actionType',
        'action.description as "actionDescription',
        `(${owmGrantSub}) as "ownGrant`,
        `(${parentGrantSub}) as "parentGrant`,
      ])
      .from(Action, 'action')
      .getQuery();

    const qb = this.manager
      .createQueryBuilder()
      .addCommonTableExpression(rolesCte, 'roles', {
        recursive: true,
        columnNames: ['name', 'parentName'],
      })
      .addCommonTableExpression(accessObjectsCte, 'access_objects', {
        recursive: false,
        columnNames: ['objectName', 'objectParentName', 'objectType'],
      })
      .addCommonTableExpression(roleActionsCte, 'role_actions', {
        recursive: false,
        columnNames: ['actionName', 'actionType', 'actionDescription', 'ownGrant', 'parentGrant'],
      })
      .select([
        'access_objects."objectName" as "objectName"',
        'access_objects."objectParentName" as "objectParentName"',
        'access_objects."objectType" as "objectType"',

        'role_actions."actionName" as "actionName"',
        'role_actions."actionType" as "actionType"',
        'role_actions."actionDescription" as "actionDescription"',

        'role_actions."ownGrant" as "ownGrant"',
        'role_actions."parentGrant" as "parentGrant"',
      ])
      .from('access_objects', 'access_objects')
      .leftJoin(AccessObjectAction, 'aoa', 'aoa.objectName = access_objects."objectName"')
      .leftJoin('role_actions', 'role_actions', 'role_actions."actionName" = aoa."action_name"')
      .orderBy('access_objects."objectParentName"', 'ASC', 'NULLS FIRST')
      .setParameters({ roleName });

    const flatTree = await qb.getRawMany<TFlatTreeItem>();

    console.log({ flatTree });

    return flatToNestedTree(flatTree);
  }

  // todo - удалить
  async getAccessObjectTree(): Promise<AccessObjectNodeResponseDto[]> {
    // Получаем все объекты доступа
    const accessObjects = await this.manager.find(AccessObject);

    // Получаем все связи объектов с действиями
    const objectActions = await this.manager.find(AccessObjectAction, {
      relations: ['action'],
    });

    // Создаем мапу действий для каждого объекта
    const objectActionsMap = new Map<string, Action[]>();

    objectActions.forEach((oa) => {
      const actions = objectActionsMap.get(oa.objectName) || [];
      actions.push(oa.action);
      objectActionsMap.set(oa.objectName, actions);
    });

    // Создаем дерево объектов
    return this.buildTree(accessObjects, objectActionsMap);
  }

  private buildTree(objects: AccessObject[], objectActionsMap: Map<string, Action[]>): AccessObjectNodeResponseDto[] {
    // Создаем мапу объектов для быстрого доступа
    const objectsMap = new Map<string, AccessObject>();
    objects.forEach((obj) => objectsMap.set(obj.name, obj));

    // Находим корневые объекты (без родителя)
    const rootObjects = objects.filter((obj) => !obj.parentName);

    // Рекурсивно строим дерево
    return rootObjects.map((root) => this.buildNode(root, objectsMap, objectActionsMap));
  }

  private buildNode(
    object: AccessObject,
    objectsMap: Map<string, AccessObject>,
    objectActionsMap: Map<string, Action[]>,
  ): AccessObjectNodeResponseDto {
    // Находим все дочерние объекты
    const children = Array.from(objectsMap.values()).filter((obj) => obj.parentName === object.name);

    // Создаем узел дерева
    return {
      name: object.name,
      type: object.type,
      actions: (objectActionsMap.get(object.name) || []).map((action) => ({
        name: action.name,
        type: action.type,
      })),
      children: children.length
        ? children.map((child) => this.buildNode(child, objectsMap, objectActionsMap))
        : undefined,
    };
  }
}
