import { DeepPartial, EntityManager } from 'typeorm';

import { Role } from '../../../libs/db/entity';

export class RoleRepository {
  async create(em: EntityManager, dto: DeepPartial<Role>): Promise<Role> {
    return em.save(em.create(Role, dto));
  }

  async update(em: EntityManager, name: string, dto: DeepPartial<Role>): Promise<void> {
    await em.update(Role, { name }, dto);
  }

  async delete(em: EntityManager, name: string): Promise<void> {
    await em.delete(Role, { name });
  }
}
