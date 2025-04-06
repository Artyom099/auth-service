import { Injectable } from '@nestjs/common';
import { Device } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { TransactionType } from '../../../libs/db';

@Injectable()
export class DeviceQueryRepository {
  constructor(private prisma: PrismaService) {}

  async getDevices(userId: string, tx?: TransactionType): Promise<Device[]> {
    const context = tx || this.prisma;

    return context.device.findMany({ where: { userId } });
  }
}
