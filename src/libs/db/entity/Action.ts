import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('action')
export class Action {
  @PrimaryColumn()
  name: string;

  @Column()
  type: string;

  // todo - join table
}
