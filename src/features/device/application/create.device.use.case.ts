import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceRepository } from '../infrastructure/devices.repository';
import { Contract } from '../../../infrastructure/contract/contract';

export class CreateDeviceCommand {
  constructor(
    public userId: number,
    public ip: string,
    public deviceName: string,
  ) {}
}

@CommandHandler(CreateDeviceCommand)
export class CreateDeviceUseCase
  implements ICommandHandler<CreateDeviceCommand>
{
  constructor(private deviceRepository: DeviceRepository) {}

  async execute(
    command: CreateDeviceCommand,
  ): Promise<Contract<{ deviceId: string }>> {
    const { userId, ip, deviceName } = command;

    return this.deviceRepository.createDevice(
      userId,
      ip,
      deviceName,
      new Date(),
    );
  }
}
