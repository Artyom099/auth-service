import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { User } from '../User';

@Entity('user_email_confirmation')
export class UserEmailConfirmation {
  @Column({
    name: 'confirmation_code',
    type: 'varchar',
    nullable: true,
    length: 50,
    unique: true,
  })
  confirmationCode: string;

  @Column({
    name: 'expiration_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  expirationDate: Date;

  @Column({
    name: 'is_confirmed',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isConfirmed: boolean;

  @Column({
    name: 'email',
    type: 'varchar',
    nullable: false,
    length: 50,
    unique: true,
  })
  email: string;

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
