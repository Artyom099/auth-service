import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('access_object')
export class AccessObject {
  @PrimaryColumn()
  name: string;

  @Column()
  type: string;

  @Column()
  parentName?: string;
}
