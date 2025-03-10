import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { TokenService } from '../../services/token.service';
import { DeviceRepository } from '../../../repositories/device/DeviceRepository';
import {
  ResultType,
  SuccessResult,
} from '../../../../libs/error-handling/result';

export class DeleteOtherDevicesCommand {
  constructor(
    public userId: number,
    public token: string,
  ) {}
}

@CommandHandler(DeleteOtherDevicesCommand)
export class DeleteOtherDevicesUseCase
  implements ICommandHandler<DeleteOtherDevicesCommand>
{
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: DeleteOtherDevicesCommand): Promise<ResultType<null>> {
    const { userId, token } = command;

    return this.prisma.$transaction(async (tx) => {
      const payload = await this.tokenService.verifyRefreshToken(token);

      await this.deviceRepository.deleteOtherDevices(
        payload.deviceId,
        userId,
        tx,
      );

      return new SuccessResult(null);
    });
  }
}
