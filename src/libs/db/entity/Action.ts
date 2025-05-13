import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';

import { AccessObject } from './AccessObject';
import { Role } from './Role';

@Entity('action')
export class Action {
  @PrimaryColumn()
  name: string;

  @Column()
  type: string;

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
}
