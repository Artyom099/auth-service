import { Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { User } from '../User';

@Entity('oauth_vk_user')
export class OauthVkUser {
  @PrimaryColumn({
    name: 'vk_id',
    type: 'integer',
    nullable: false,
  })
  vkId: number;

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
