import { Prisma, User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TransactionType } from '../../../libs/db/TransactionType';
import { OauthServicesTypesEnum } from '../../enums/oauth.services.types.enum';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async getByProvider(
    provider: OauthServicesTypesEnum,
    id: number | string,
    tx?: TransactionType,
  ): Promise<User> {
    const context = tx || this.prisma;

    return context.user.findFirst({
      where: { [provider]: { id } },
      include: { [provider]: true },
    });
  }

  async getUser<T extends Prisma.UserInclude>(
    params: Prisma.UserWhereInput,
    additionalFields?: T,
    tx?: TransactionType,
  ): Promise<Prisma.UserGetPayload<{ include: T }>> {
    const context = tx || this.prisma;

    return context.user.findFirst({ where: params, include: additionalFields });
  }

  async getUserByLoginOrEmail(
    loginOrEmail: string,
    tx?: TransactionType,
  ): Promise<User> {
    const context = tx || this.prisma;

    return context.user.findFirst({
      where: {
        OR: [{ login: loginOrEmail }, { email: loginOrEmail }],
      },
    });
  }

  async create(
    data: Prisma.UserCreateInput,
    tx?: TransactionType,
  ): Promise<{ id: number }> {
    const context = tx || this.prisma;

    return context.user.create({
      data,
      select: { id: true },
    });
  }

  async deleteUser(id: number, tx?: TransactionType): Promise<void> {
    const context = tx || this.prisma;

    await context.user.delete({ where: { id } });
  }

  async update(
    id: number,
    user: Prisma.UserUpdateInput,
    tx?: TransactionType,
  ): Promise<void> {
    const context = tx || this.prisma;

    await context.user.update({
      where: { id },
      data: user,
    });
  }
}
