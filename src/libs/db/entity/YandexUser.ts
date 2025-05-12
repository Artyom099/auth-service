import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { User } from './User';

@Entity('yandex_user')
export class YandexUser {
  @PrimaryColumn({
    name: 'yandex_id',
    type: 'varchar',
    nullable: false,
  })
  yandexId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: false,
  })
  userId: string;
}
