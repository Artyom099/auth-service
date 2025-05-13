import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

import { Action } from './Action';

@Entity('access_object')
export class AccessObject {
  @PrimaryColumn()
  name: string;

  @Column()
  type: string;

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
