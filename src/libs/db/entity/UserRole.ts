import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Role } from './Role';
import { User } from './User';

@Entity('user_role')
export class UserRole {
  @PrimaryColumn({
    name: 'user_id',
  })
  userId: string;

  @PrimaryColumn({
    name: 'role_name',
  })
  roleName: string;

  @ManyToOne(() => User, (u) => u.id)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Role, (r) => r.name)
  @JoinColumn({ name: 'role_name', referencedColumnName: 'name' })
  role: Role;
}
