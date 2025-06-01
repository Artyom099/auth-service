import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { AccessObject } from './AccessObject';
import { Action } from './Action';

export interface IAccessObjectAction {
  objectName: string;
  actionName: string;
}

@Entity('access_object_action')
export class AccessObjectAction implements IAccessObjectAction {
  @PrimaryColumn({
    name: 'object_name',
  })
  objectName: string;

  @PrimaryColumn({
    name: 'action_name',
  })
  actionName: string;

  @ManyToOne(() => AccessObject, (ao) => ao.name)
  @JoinColumn({ name: 'object_name', referencedColumnName: 'name' })
  accessObject: AccessObject;

  @ManyToOne(() => Action, (a) => a.name)
  @JoinColumn({ name: 'action_name', referencedColumnName: 'name' })
  action: Action;
}
