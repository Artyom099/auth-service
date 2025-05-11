import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Action } from './Action';

@Entity('access_object_action')
export class AccessObjectAction {
  @PrimaryColumn({
    name: 'object_name',
  })
  objectName: string;

  @PrimaryColumn({
    name: 'action_name',
  })
  actionName: string;

  @ManyToOne(() => Action)
  @JoinColumn({ name: 'action_name', referencedColumnName: 'name' })
  action: Action;
}
