import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { AccessObject, AccessObjectAction, Action } from '../../../libs/db/entity';
import { AccessObjectNodeResponseDto } from '../../../libs/dto/output/AccessObjectNodeResponseDto';
import { flatToNestedTree, TFlatTreeItem } from '../../../libs/utils';

@Injectable()
export class AccessObjectQueryRepository {
  constructor(private manager: EntityManager) {}

  /**
   * Запрос есть в обсидиане todo
   * Так же надо будет сделать функцию flatToNestedTree
   */
  public async calculateRightTree(): Promise<any> {
    const rolesCte = [];

    // todo - запрос копируем полностью
    const qb = this.manager.createQueryBuilder();

    const flatTree = await qb.getRawMany<TFlatTreeItem>();

    return flatToNestedTree(flatTree);
  }

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
