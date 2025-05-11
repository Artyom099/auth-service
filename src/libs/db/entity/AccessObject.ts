import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('access_object')
export class AccessObject {
  @PrimaryColumn()
  name: string;

  @Column()
  type: string;

  @Column({
    name: 'parent_name',
    nullable: true,
  })
  parentName?: string;
}
