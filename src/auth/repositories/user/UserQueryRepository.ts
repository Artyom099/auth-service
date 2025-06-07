import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { User, UserEmailConfirmation, UserRole } from '../../../libs/db/entity';
import {
  GetUserInfoResponseDto,
  UserGetListResponseDto,
  UserGetRolesRequestDto,
  UserGetRolesResponseDto,
} from '../../../libs/dto';

@Injectable()
export class UserQueryRepository {
  constructor(private manager: EntityManager) {}

  public async getUserInfo(id: string): Promise<GetUserInfoResponseDto> {
    const qb = this.manager
      .createQueryBuilder(User, 'u')
      .select('u.id', 'id')
      .addSelect('u.login', 'login')
      .addSelect('uec.email', 'email')
      .innerJoin(UserEmailConfirmation, 'uec', 'uec.userId = u.id')
      .where({ id });

    return qb.getRawOne<GetUserInfoResponseDto>();
  }

  public async getUserList(): Promise<UserGetListResponseDto[]> {
    const qb = this.manager
      .createQueryBuilder(User, 'u')
      .select('u.id', 'id')
      .addSelect('u.login', 'login')
      .orderBy('u.createdAt', 'DESC');

    return qb.getRawMany<UserGetListResponseDto>();
  }

  public async getUserRoles(dto: UserGetRolesRequestDto): Promise<UserGetRolesResponseDto[]> {
    return this.manager.findBy(UserRole, { userId: dto.userId });
  }
}
