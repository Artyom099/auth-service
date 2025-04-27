import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from '../User';

@Entity('device')
export class Device {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    name: 'ip',
    type: 'varchar',
    nullable: false,
  })
  ip: string;

  @Column({
    name: 'device_name',
    type: 'varchar',
    nullable: false,
  })
  deviceName: string;

  @Column({
    name: 'issued_at',
    type: 'timestamp with time zone',
    nullable: false,
  })
  issuedAt: Date;

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column({
    name: 'user_id',
    type: 'varchar',
    nullable: false,
  })
  userId: string;
}
