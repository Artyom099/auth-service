import { Entity, PrimaryColumn } from 'typeorm';

@Entity('access_object_action')
export class AccessObjectAction {
  @PrimaryColumn()
  objectName: string;

  @PrimaryColumn()
  actionName: string;
}
