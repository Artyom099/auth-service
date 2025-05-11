import { Entity, PrimaryColumn } from 'typeorm';

@Entity('right')
export class Right {
  @PrimaryColumn()
  actionName: string;

  @PrimaryColumn()
  roleName: string;
}
