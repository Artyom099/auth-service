import { Entity, PrimaryColumn } from 'typeorm';

@Entity('right')
export class Right {
  @PrimaryColumn({
    name: 'action_name',
  })
  actionName: string;

  @PrimaryColumn({
    name: 'role_name',
  })
  roleName: string;
}
