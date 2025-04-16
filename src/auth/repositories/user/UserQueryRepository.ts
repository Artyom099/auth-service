import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { User } from '../../../libs/db/entity';
import { UserViewModel } from '../../api/models/view/user.view.model';

@Injectable()
export class UserQueryRepository {
  constructor(private manager: EntityManager) {}

  async getUser(id: string): Promise<UserViewModel> {
    const user = await this.manager.findOneBy(User, { id });

    return this.mapToView(user);
  }

  mapToView(user: User): UserViewModel {
    return {
      // email: user.email,
      login: user.login,
      userId: user.id,
    };
  }
}
