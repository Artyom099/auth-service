import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { DeviceRepository } from '../../../device/infrastructure/devices.repository';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';
import { UpdateSessionCommand } from '../../../device/application/update.session.use.case';

export class RefreshSessionCommand {
  constructor(
    public userId: number,
    public deviceId: string,
    public iat: number,
  ) {}
}

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionUseCase
  implements ICommandHandler<RefreshSessionCommand>
{
  constructor(
    private commandBus: CommandBus,
    private jwtService: JwtService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(
    command: RefreshSessionCommand,
  ): Promise<Contract<{ accessToken: string; refreshToken: string }>> {
    const { userId, deviceId, iat } = command;

    const deviceResult = await this.deviceRepository.getDevice(deviceId);
    if (deviceResult.hasError()) return new Contract(InternalCode.Unauthorized);

    if (
      userId !== deviceResult.payload.userId ||
      iat !== Math.trunc(+deviceResult.payload.issuedAt / 1000)
    )
      return new Contract(InternalCode.Unauthorized);

    const updateSessionTime = await this.commandBus.execute(
      new UpdateSessionCommand(deviceId),
    );
    if (updateSessionTime.hasError())
      return new Contract(InternalCode.Internal_Server);

    const accessToken = await this.jwtService.signAsync(
      { userId },
      { expiresIn: '30m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { userId, deviceId },
      { expiresIn: '200m' },
    );

    return new Contract(InternalCode.Success, { accessToken, refreshToken });
  }
}
