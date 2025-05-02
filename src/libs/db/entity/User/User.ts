import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Device } from '../Device';
import { OauthVkUser } from '../OauthVkUser';
import { UserEmailConfirmation } from '../UserEmailConfirmation';
import { UserPasswordRecovery } from '../UserPasswordRecovery';
import { YandexUser } from '../YandexUser';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'login',
    type: 'varchar',
    nullable: false,
    length: 50,
    unique: true,
  })
  login: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: false,
    length: 255,
    unique: true,
  })
  passwordHash: string;

  @Column({
    name: 'created_at',
    type: 'date',
    nullable: false,
    default: new Date(),
  })
  createdAt: Date;

  @OneToMany(() => Device, (device) => device.userId)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  devices: Device[];

  @OneToOne(() => UserEmailConfirmation)
  emailConfirmationInfo?: UserEmailConfirmation;

  @OneToOne(() => UserPasswordRecovery)
  userPasswordRecovery?: UserPasswordRecovery;

  @OneToOne(() => OauthVkUser)
  oauthVkUser?: OauthVkUser;

  @OneToOne(() => YandexUser)
  yandexUser?: YandexUser;
}
