import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceRepository } from '../../../device/infrastructure/devices.repository';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';
import { DeleteDeviceCommand } from '../../../device/application/delete.device.use.case';

export class LogOutCommand {
  constructor(
    public userId: number,
    public deviceId: string,
    public iat: number,
  ) {}
}

@CommandHandler(LogOutCommand)
export class LogOutUseCase implements ICommandHandler<LogOutCommand> {
  constructor(
    private commandBus: CommandBus,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: LogOutCommand): Promise<Contract<null>> {
    const { userId, deviceId, iat } = command;

    const deviceResult = await this.deviceRepository.getDevice(deviceId);
    if (deviceResult.hasError()) return new Contract(InternalCode.Unauthorized);

    if (
      deviceResult.payload.userId !== userId ||
      iat !== Math.trunc(+deviceResult.payload.issuedAt / 1000)
    )
      return new Contract(InternalCode.Unauthorized);

    return this.commandBus.execute(new DeleteDeviceCommand(deviceId));
  }
}
