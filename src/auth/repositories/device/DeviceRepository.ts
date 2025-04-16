import { Injectable } from '@nestjs/common';
import { EntityManager, Not } from 'typeorm';

import { Device } from '../../../libs/db/entity';
import { CreateDeviceDTO } from '../../api/models/dto/create.device.dto';

@Injectable()
export class DeviceRepository {
  constructor() {}

  async createDevice(em: EntityManager, data: CreateDeviceDTO): Promise<{ deviceId: string }> {
    const device = await em.save(em.create(Device, data));

    return { deviceId: device.id };
  }

  async getDevice(em: EntityManager, id: string): Promise<Device> {
    return em.findOneBy(Device, { id });
  }

  async getUserDevices(em: EntityManager, userId: string): Promise<Device[]> {
    return em.findBy(Device, { userId });
  }

  async updateIssuedAt(em: EntityManager, id: string, issuedAt: Date): Promise<void> {
    await em.update(Device, { id }, { issuedAt });
  }

  async deleteDevice(em: EntityManager, id: string): Promise<void> {
    await em.delete(Device, { id });
  }

  async deleteOtherDevices(em: EntityManager, id: string, userId: string): Promise<void> {
    await em.delete(Device, {
      userId,
      id: Not(id),
    });
  }
}
