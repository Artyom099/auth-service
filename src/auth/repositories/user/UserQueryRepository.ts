import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserViewModel } from '../../api/models/view/user.view.model';

@Injectable()
export class UserQueryRepository {
  constructor(private prisma: PrismaService) {}

  async getUser(id: number): Promise<UserViewModel> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    return this.mapToView(user);
  }

  mapToView(user: User): UserViewModel {
    return {
      email: user.email,
      login: user.login,
      userId: user.id,
    };
  }
}
