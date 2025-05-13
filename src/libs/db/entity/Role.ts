import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

import { Action } from './Action';
import { User } from './User';

@Entity('role')
export class Role {
  @PrimaryColumn()
  name: string;

  @Column()
  description: string;

  /**
   * пользователи, которым выдана текущая роль
   */
  @ManyToMany(() => User, (a) => a.roles)
  users: User[];

  /**
   * бизнес-действия, разрешенные текущей роли
   */
  @ManyToMany(() => Action, (a) => a.roles)
  @JoinTable({
    name: 'right',
    joinColumn: {
      name: 'role_name',
      referencedColumnName: 'name',
    },
    inverseJoinColumn: {
      name: 'action_name',
      referencedColumnName: 'name',
    },
  })
  grantedActions: Action[];
}
