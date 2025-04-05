import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../User';

@Entity('device')
export class Device {
  @PrimaryGeneratedColumn('uuid')
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
    type: 'varchar',
    nullable: false,
  })
  issuedAt: Date;

  userId: string;

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;
}
