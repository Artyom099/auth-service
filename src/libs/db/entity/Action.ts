import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

import { AccessObject } from './AccessObject';
import { Api } from './Api';
import { Role } from './Role';

export enum EActionType {
  READ = 'r',
  WRITE = 'w',
  SPECIAL = 's',
}

export interface IAction {
  name: string;
  type: EActionType;
  description?: string;
}

@Entity('action')
export class Action implements IAction {
  @PrimaryColumn()
  name: string;

  @Column()
  type: EActionType;

  @Column({
    nullable: true,
  })
  description?: string;

  /**
   * объекты доступа, которым разрешено текущее действие
   */
  @ManyToMany(() => AccessObject, (ao) => ao.actions)
  objects: AccessObject[];

  /**
   * роли, которым разрешено текущее действие
   */
  @ManyToMany(() => Role, (r) => r.grantedActions)
  roles: Role[];

  /**
   * апи, доступ к которым нужен для выполнения конкретного действия
   */
  @ManyToMany(() => Api, (api) => api.actions)
  @JoinTable({
    name: 'action_api',
    joinColumn: {
      name: 'action_name',
      referencedColumnName: 'name',
    },
    inverseJoinColumn: {
      name: 'api_name',
      referencedColumnName: 'name',
    },
  })
  literals: Api[];
}
