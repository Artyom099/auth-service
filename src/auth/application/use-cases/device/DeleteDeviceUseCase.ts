import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
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
        return new ErrorResult({
          code: InternalErrorCode.NotFound,
          extensions: [],
        });
      }

      const activeDevices = await this.deviceRepository.getUserDevices(em, userId);

      // если среди активных девайсов юзера нет девайса, который хотим удалить, кидаем ошибку
      if (!activeDevices.find((d) => d.id === device.id)) {
        return new ErrorResult({
          code: InternalErrorCode.Forbidden,
          extensions: [],
        });
      }

      await this.deviceRepository.deleteDevice(em, id);

      return new SuccessResult(null);
    });
  }
}
