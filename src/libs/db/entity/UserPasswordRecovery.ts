import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { User } from './User';

@Entity('user_password_recovery')
export class UserPasswordRecovery {
  @Column({
    name: 'recovery_code',
    type: 'varchar',
    nullable: false,
    length: 50,
    unique: true,
  })
  recoveryCode: string;

  @Column({
    name: 'expiration_date',
    type: 'timestamp with time zone',
    nullable: false,
  })
  expirationDate: Date;

  @Column({
    name: 'is_confirmed',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isConfirmed: boolean;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
  })
  userId: string;
}
