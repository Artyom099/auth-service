import { UserPasswordRecovery } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { TransactionType } from '../../../libs/db';
import { UpdateCodeDTO } from '../../api/models/dto/update.code.dto';

export class PasswordRecoveryRepository {
  constructor(private prisma: PrismaService) {}

  async getRecoveryData(code: string, tx?: TransactionType): Promise<UserPasswordRecovery> {
    const context = tx || this.prisma;

    return context.userPasswordRecovery.findFirst({
      where: { recoveryCode: code },
    });
  }

  async confirmRecoveryPassword(userId: number, tx?: TransactionType): Promise<void> {
    const context = tx || this.prisma;

    await context.userPasswordRecovery.update({
      where: { userId },
      data: { isConfirmed: true },
    });
  }

  async upsertRecoveryData(data: UpdateCodeDTO, tx?: TransactionType): Promise<UserPasswordRecovery> {
    const { userId, expirationDate, code } = data;
    const context = tx || this.prisma;

    return context.userPasswordRecovery.upsert({
      where: { userId },
      update: { expirationDate, recoveryCode: code, isConfirmed: false },
      create: { expirationDate, userId },
    });
  }

  async updatePassword(id: number, passwordHash: string, tx?: TransactionType): Promise<void> {
    const context = tx || this.prisma;

    await context.user.update({ where: { id }, data: { passwordHash } });
  }
}
