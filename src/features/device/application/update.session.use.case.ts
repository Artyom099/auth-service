import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeviceRepository } from '../infrastructure/devices.repository';
import { Contract } from '../../../infrastructure/contract/contract';

export class UpdateSessionCommand {
  constructor(public deviceId: string) {}
}

@CommandHandler(UpdateSessionCommand)
export class UpdateSessionUseCase
  implements ICommandHandler<UpdateSessionCommand>
{
  constructor(private deviceRepository: DeviceRepository) {}

  async execute(command: UpdateSessionCommand): Promise<Contract<null>> {
    return this.deviceRepository.updateTime(command.deviceId);
  }
}
