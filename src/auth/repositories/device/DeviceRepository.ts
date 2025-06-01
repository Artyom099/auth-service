import { EntityManager, Equal, Not } from 'typeorm';

import { Device } from '../../../libs/db/entity';
import { TDeviceCreateDto } from '../../../libs/dto/TDeviceCreateDto';

export class DeviceRepository {
  async createDevice(em: EntityManager, dto: TDeviceCreateDto): Promise<void> {
    await em.save(em.create(Device, dto));
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

  async deleteOtherDevices(em: EntityManager, id: string, userId: string): Promise<{ deletedCount: number }> {
    const deleteResult = await em.delete(Device, {
      userId,
      id: Not(Equal(id)),
    });

    // возвращаем количество удаленных девайсов
    return { deletedCount: deleteResult.affected };
  }
}
