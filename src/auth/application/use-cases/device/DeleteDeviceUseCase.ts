import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
  SuccessResult,
} from '../../../../libs/error-handling/result';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { DeviceRepository } from '../../../repositories/device/DeviceRepository';

export class DeleteDeviceCommand {
  constructor(
    public id: string,
    public userId: number,
  ) {}
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDeviceUseCase
  implements ICommandHandler<DeleteDeviceCommand>
{
  constructor(
    private prisma: PrismaService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: DeleteDeviceCommand): Promise<ResultType<null>> {
    const { id, userId } = command;

    return this.prisma.$transaction(async (tx) => {
      const device = await this.deviceRepository.getDevice(id, tx);
      if (!device)
        return new ErrorResult({
          code: InternalErrorCode.NotFound,
          extensions: [],
        });

      const activeDevices = await this.deviceRepository.getUserDevices(
        userId,
        tx,
      );

      // если среди активных девайсов юзера нет девайса, который хотим удалить, кидаем ошибку
      if (!activeDevices.find((d) => d.id === device.id))
        return new ErrorResult({
          code: InternalErrorCode.Forbidden,
          extensions: [],
        });

      await this.deviceRepository.deleteDevice(id, tx);

      return new SuccessResult(null);
    });
  }
}
