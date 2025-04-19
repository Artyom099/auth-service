import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../User';

@Entity('github_user')
export class GithubUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'username',
    type: 'varchar',
    nullable: false,
  })
  username: string;

  @Column({
    name: 'photo_url',
    type: 'varchar',
    nullable: false,
  })
  photoUrl: string;

  @Column({
    name: 'user_id',
    type: 'integer',
    nullable: false,
    unique: true,
  })
  userId: number;

  @Column({
    name: 'email',
    type: 'varchar',
    nullable: false,
  })
  email: string;

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
