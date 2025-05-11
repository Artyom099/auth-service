import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('role')
export class Role {
  @PrimaryColumn()
  name: string;

  @Column()
  description: string;
}
