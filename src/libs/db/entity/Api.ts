import { Entity, ManyToMany, PrimaryColumn } from 'typeorm';

import { Action } from './Action';

export interface IApi {
  name: string;
}

@Entity('api')
export class Api implements IApi {
  @PrimaryColumn({
    name: 'name',
  })
  name: string;

  /**
   * Бизнес-действия, для выполнения которых необходима эта апи
   */
  @ManyToMany(() => Action, (action) => action.literals)
  actions: Action[];
}
