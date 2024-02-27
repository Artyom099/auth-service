import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Contract } from '../../../infrastructure/contract/contract';
import { InternalCode } from '../../../infrastructure/utils/enums';
import { Device } from '@prisma/client';

@Injectable()
export class DeviceRepository {
  constructor(private prisma: PrismaService) {}

  async createDevice(
    userId: number,
    ip: string,
    deviceName: string,
    issuedAt: Date,
  ): Promise<Contract<{ deviceId: string }>> {
    const device = await this.prisma.device.create({
      data: {
        userId,
        ip,
        deviceName,
        issuedAt,
      },
    });

    return new Contract(InternalCode.Success, { deviceId: device.id });
  }

  async getDevice(id: string): Promise<Contract<Device>> {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });

    if (!device) return new Contract(InternalCode.NotFound);

    return new Contract(InternalCode.Success, device);
  }

  async updateTime(id: string): Promise<Contract<null>> {
    await this.prisma.device.update({
      where: { id },
      data: { issuedAt: new Date() },
    });

    return new Contract(InternalCode.Success);
  }

  async deleteDevice(id: string): Promise<Contract<null>> {
    const deleteResult = await this.prisma.device.delete({
      where: { id },
    });

    if (!deleteResult) return new Contract(InternalCode.NotFound);

    return new Contract(InternalCode.Success);
  }
}
