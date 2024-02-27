import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceRepository } from '../infrastructure/devices.repository';
import { Contract } from '../../../infrastructure/contract/contract';

export class DeleteDeviceCommand {
  constructor(public deviceId: string) {}
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDeviceUseCase
  implements ICommandHandler<DeleteDeviceCommand>
{
  constructor(private deviceRepository: DeviceRepository) {}

  async execute(command: DeleteDeviceCommand): Promise<Contract<null>> {
    return this.deviceRepository.deleteDevice(command.deviceId);
  }
}
