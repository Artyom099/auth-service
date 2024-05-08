import { Injectable } from '@nestjs/common';
import { TransactionType } from '../../../infrastructure/database/transaction.type';
import { Prisma, UserEmailConfirmation } from '@prisma/client';
import { UpdateCodeDTO } from '../../presentation/auth/models/dto/update.code.dto';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class EmailConfirmationRepository {
  constructor(private prisma: PrismaService) {}

  async confirmEmail(userId: number, tx?: TransactionType): Promise<void> {
    const context = tx || this.prisma;

    await context.userEmailConfirmation.update({
      where: { userId },
      data: { isConfirmed: true },
    });
  }

  async create(
    data: Prisma.UserEmailConfirmationCreateArgs['data'],
    tx?: TransactionType,
  ) {
    const context = tx || this.prisma;

    return context.userEmailConfirmation.create({
      data,
      select: { confirmationCode: true },
    });
  }

  async getConfirmationDataByCode(
    code: string,
    tx?: TransactionType,
  ): Promise<UserEmailConfirmation> {
    const context = tx || this.prisma;

    return context.userEmailConfirmation.findFirst({
      where: { confirmationCode: code },
    });
  }

  async getConfirmationDataByEmail(
    email: string,
    tx?: TransactionType,
  ): Promise<UserEmailConfirmation> {
    const context = tx || this.prisma;

    return context.userEmailConfirmation.findFirst({
      where: { user: { email } },
    });
  }

  async updateConfirmationData(
    data: UpdateCodeDTO,
    tx?: TransactionType,
  ): Promise<string> {
    const { userId, expirationDate, code } = data;
    const context = tx || this.prisma;

    const confirmationData = await context.userEmailConfirmation.update({
      where: { userId },
      data: {
        expirationDate,
        confirmationCode: code,
      },
    });

    return confirmationData.confirmationCode;
  }
}
