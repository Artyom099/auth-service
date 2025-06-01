import { Entity, PrimaryColumn } from 'typeorm';

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
}
