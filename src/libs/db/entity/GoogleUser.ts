import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from './User';

@Entity('GoogleUser')
export class GoogleUser {
  @PrimaryColumn('varchar')
  id: string;

  @Column({
    name: 'email',
    type: 'varchar',
    nullable: false,
  })
  email: string;

  @Column({
    name: 'photo_url',
    type: 'varchar',
    nullable: true,
  })
  photoUrl?: string;

  @Column({
    name: 'user_id',
    type: 'integer',
    nullable: false,
    unique: true,
  })
  userId: number;

  @Column({
    name: 'username',
    type: 'varchar',
    nullable: false,
  })
  username: string;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
