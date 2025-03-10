import { Injectable } from '@nestjs/common';
import { Device } from '@prisma/client';
import { CreateDeviceDTO } from '../../api/models/dto/create.device.dto';
import { TransactionType } from '../../../libs/db/TransactionType';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class DeviceRepository {
  constructor(private prisma: PrismaService) {}

  async createDevice(
    data: CreateDeviceDTO,
    tx: TransactionType,
  ): Promise<{ deviceId: string }> {
    const context = tx || this.prisma;

    const device = await context.device.create({ data: { ...data } });

    return { deviceId: device.id };
  }

  async getDevice(id: string, tx: TransactionType): Promise<Device> {
    const context = tx || this.prisma;

    return context.device.findUnique({ where: { id } });
  }

  async getUserDevices(userId: number, tx: TransactionType): Promise<Device[]> {
    const context = tx || this.prisma;

    return context.device.findMany({ where: { userId } });
  }

  async updateIssuedAt(
    id: string,
    issuedAt: Date,
    tx: TransactionType,
  ): Promise<void> {
    const context = tx || this.prisma;

    await context.device.update({ where: { id }, data: { issuedAt } });
  }

  async deleteDevice(id: string, tx: TransactionType): Promise<void> {
    const context = tx || this.prisma;

    await context.device.delete({ where: { id } });
  }

  async deleteOtherDevices(
    id: string,
    userId: number,
    tx: TransactionType,
  ): Promise<void> {
    const context = tx || this.prisma;

    await context.device.deleteMany({
      where: {
        AND: { userId, NOT: { id } },
      },
    });
  }
}
