import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

import { Action } from './Action';

export enum EAccessObjectType {
  APP = 'APP',
  TAB = 'TAB',
  BUTTON = 'BUTTON',
}

export interface IAccessObject {
  name: string;
  type: EAccessObjectType;
  parentName?: string;
}

@Entity('access_object')
export class AccessObject implements IAccessObject {
  @PrimaryColumn()
  name: string;

  @Column()
  type: EAccessObjectType;

  @Column({
    name: 'parent_name',
    nullable: true,
  })
  parentName?: string;

  /**
   * набор бизнес-действий текущего объекта доступа
   */
  @ManyToMany(() => Action, (a) => a.objects)
  @JoinTable({
    name: 'access_object_action',
    joinColumn: {
      name: 'object_name',
      referencedColumnName: 'name',
    },
    inverseJoinColumn: {
      name: 'action_name',
      referencedColumnName: 'name',
    },
  })
  actions: Action[];
}
