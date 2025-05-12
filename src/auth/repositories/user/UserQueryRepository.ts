import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { User, UserEmailConfirmation } from '../../../libs/db/entity';
import { GetUserInfoResponseDto } from '../../../libs/dto/GetUserInfoResponseDto';

@Injectable()
export class UserQueryRepository {
  constructor(private manager: EntityManager) {}

  async getUserInfo(id: string): Promise<GetUserInfoResponseDto> {
    const qb = this.manager
      .createQueryBuilder(User, 'u')
      .select('u.id', 'id')
      .addSelect('u.login', 'login')
      .addSelect('uec.email', 'email')
      .innerJoin(UserEmailConfirmation, 'uec', 'uec.userId = u.id')
      .where({ id });

    return qb.getRawOne<GetUserInfoResponseDto>();
  }
}
