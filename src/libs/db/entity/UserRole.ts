import { Entity, PrimaryColumn } from 'typeorm';

@Entity('user_role')
export class UserRole {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  roleName: string;
}
