import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Action } from './Action';
import { Api } from './Api';

export interface IActionApi {
  apiName: string;
  actionName: string;
}

@Entity('action_api')
export class ActionApi implements IActionApi {
  @PrimaryColumn({
    name: 'api_name',
  })
  apiName: string;

  @PrimaryColumn({
    name: 'action_name',
  })
  actionName: string;

  @ManyToOne(() => Action, (a) => a.name)
  @JoinColumn({ name: 'action_name', referencedColumnName: 'name' })
  action: Action;

  @ManyToOne(() => Api, (a) => a.name)
  @JoinColumn({ name: 'api_name', referencedColumnName: 'name' })
  api: Api;
}
