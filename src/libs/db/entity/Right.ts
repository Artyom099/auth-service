import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Action } from './Action';
import { Role } from './Role';

export interface IRight {
  roleName: string;
  actionName: string;
}

@Entity('right')
export class Right {
  @PrimaryColumn({
    name: 'role_name',
  })
  roleName: string;

  @PrimaryColumn({
    name: 'action_name',
  })
  actionName: string;

  @ManyToOne(() => Role, (r) => r.name)
  @JoinColumn({ name: 'role_name', referencedColumnName: 'name' })
  role: Role;

  @ManyToOne(() => Action, (a) => a.name)
  @JoinColumn({ name: 'action_name', referencedColumnName: 'name' })
  action: Action;
}
