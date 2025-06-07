import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Device } from '../../../libs/db/entity';

@Injectable()
export class DeviceQueryRepository {
  constructor(private manager: EntityManager) {}

  async getDevices(userId: string): Promise<Device[]> {
    return this.manager.find(Device, {
      where: { userId },
      order: { issuedAt: 'desc' },
    });
  }
}
