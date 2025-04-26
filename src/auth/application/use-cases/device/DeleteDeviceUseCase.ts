import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { DeviceRepository } from '../../../repositories';

export class DeleteDeviceCommand {
  constructor(
    public id: string,
    public userId: string,
  ) {}
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDeviceUseCase implements ICommandHandler<DeleteDeviceCommand> {
  constructor(
    private manager: EntityManager,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: DeleteDeviceCommand): Promise<ResultType<null>> {
    const { id, userId } = command;

    return this.manager.transaction(async (em) => {
      const device = await this.deviceRepository.getDevice(em, id);
      if (!device) {
        throw new BadRequestException(`Device with id ${id} not found`);
      }

      const userDevices = await this.deviceRepository.getUserDevices(em, userId);

      // если среди девайсов юзера нет девайса, который хотим удалить, кидаем ошибку
      if (!userDevices.find((d) => d.id === device.id)) {
        throw new ForbiddenException(`Device with id ${id} is not your device`);
      }

      await this.deviceRepository.deleteDevice(em, id);

      return new SuccessResult(null);
    });
  }
}
