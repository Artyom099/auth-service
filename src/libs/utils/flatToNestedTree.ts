import { EAccessObjectType, EActionType } from '../db/entity';

export type TFlatTreeItem = {
  objectName: string;
  objectType: EAccessObjectType;
  actionName: string;
  actionType: EActionType;
  ownGrant: boolean;
  parentGrant: boolean; // todo - для этого поля надо делать иерархию ролей
};

export type TActionGrant = {
  actionName: string;
  objectType: EAccessObjectType;
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
  return [
    {
      objectName: 'market',
      objectType: EAccessObjectType.APP,
    },
  ];
}
