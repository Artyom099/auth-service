import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TransactionType } from '../../../infrastructure/database/transaction.type';
import { Device } from '@prisma/client';

@Injectable()
export class DeviceQueryRepository {
  constructor(private prisma: PrismaService) {}

  async getDevices(userId: number, tx?: TransactionType): Promise<Device[]> {
    const context = tx || this.prisma;

    return context.device.findMany({ where: { userId } });
  }
}
