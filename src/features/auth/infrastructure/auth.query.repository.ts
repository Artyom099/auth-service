import { PrismaService } from '../../../../prisma/prisma.service';
import { Contract } from '../../../infrastructure/contract/contract';
import { UserViewModel } from '../api/models/view/user.view.model';
import { InternalCode } from '../../../infrastructure/utils/enums';
import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthQueryRepository {
  constructor(private prisma: PrismaService) {}

  async getUser(userId: number): Promise<Contract<UserViewModel>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) return new Contract(InternalCode.NotFound);

    return new Contract(InternalCode.Success, this.mapToView(user));
  }

  mapToView(user: User): UserViewModel {
    return {
      email: user.email,
      login: user.login,
      userId: user.id,
    };
  }
}
