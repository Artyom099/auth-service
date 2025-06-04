import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Role } from './Role';

export interface IRoleHierarchy {
  name: string;
  parentName: string;
}

@Entity('role_hierarchy')
export class RoleHierarchy implements IRoleHierarchy {
  @PrimaryColumn({
    name: 'name',
  })
  name: string;

  @PrimaryColumn({
    name: 'parent_name',
  })
  parentName: string;

  @ManyToOne(() => Role, (r) => r.name)
  @JoinColumn({ name: 'name', referencedColumnName: 'name' })
  role: Role;

  @ManyToOne(() => Role, (r) => r.name)
  @JoinColumn({ name: 'parent_name', referencedColumnName: 'name' })
  parentRole: Role;
}
