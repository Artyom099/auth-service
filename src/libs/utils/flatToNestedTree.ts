import { EAccessObjectType, EActionType } from '../db/entity';

export type TFlatTreeItem = {
  objectName: string;
  objectParentName: string;
  objectType: EAccessObjectType;

  actionName: string;
  actionType: EActionType;
  actionDescription: string;

  ownGrant: boolean;
  parentGrant: boolean;
};

export type TActionGrant = {
  actionName: string;
  objectType: EAccessObjectType;
  actionDescription: string;
  ownGrant: boolean;
  parentGrant: boolean;
};

export type TNestedTreeItem = {
  objectName: string;
  objectType: EAccessObjectType;
  actions?: TActionGrant[];
  children?: TNestedTreeItem[];
};

/**
 * accessObject1 --> ...
 * |
 * |__accessObject11 --> [action1, action2, ...]
 * |  |__accessObject111 --> [action1, action2, ...]
 * |
 * |__accessObject12 --> [action1, action2, ...]
 *    |__accessObject121 --> [action1, action2, ...]
 *    |__accessObject122 --> [action1, action2, ...]
 *
 * accessObject2 --> ...
 */
export function flatToNestedTree(flatTree: TFlatTreeItem[]): TNestedTreeItem[] {
  // Создаем мапу для быстрого доступа к элементам по objectName
  const itemMap = new Map<string, TNestedTreeItem>();

  // Создаем корневой массив для элементов верхнего уровня
  const rootItems: TNestedTreeItem[] = [];

  // Группируем действия по объектам
  const actionsByObject = new Map<string, TActionGrant[]>();
  flatTree.forEach((item) => {
    const action: TActionGrant = {
      actionName: item.actionName,
      objectType: item.objectType,
      actionDescription: item.actionDescription,
      ownGrant: item.ownGrant,
      parentGrant: item.parentGrant,
    };

    const existingActions = actionsByObject.get(item.objectName) || [];
    actionsByObject.set(item.objectName, [...existingActions, action]);
  });

  // Первый проход: создаем все узлы без связей
  const uniqueObjects = Array.from(new Set(flatTree.map((item) => item.objectName)));
  uniqueObjects.forEach((objectName) => {
    const firstItem = flatTree.find((item) => item.objectName === objectName)!;
    itemMap.set(objectName, {
      objectName: firstItem.objectName,
      objectType: firstItem.objectType,
      actions: actionsByObject.get(objectName),
      children: [],
    });
  });

  // Второй проход: устанавливаем связи между узлами
  uniqueObjects.forEach((objectName) => {
    const firstItem = flatTree.find((item) => item.objectName === objectName)!;
    const node = itemMap.get(objectName)!;

    if (!firstItem.objectParentName) {
      // Если это корневой элемент, добавляем его в rootItems
      rootItems.push(node);
    } else {
      // Если это дочерний элемент, добавляем его в children родителя
      const parent = itemMap.get(firstItem.objectParentName);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else {
        // Если родитель не найден, считаем элемент корневым
        rootItems.push(node);
      }
    }
  });

  return rootItems;
}
