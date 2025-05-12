import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Role } from '../../../libs/db/entity';

@Injectable()
export class RoleQueryRepository {
  constructor(private manager: EntityManager) {}

  async getRoles(): Promise<Role[]> {
    return this.manager.find(Role);
  }
}
