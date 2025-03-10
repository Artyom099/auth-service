import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { TokenService } from '../../services/token.service';
import { DeviceRepository } from '../../../repositories/device/DeviceRepository';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
  SuccessResult,
} from '../../../../libs/error-handling/result';

export class LogOutCommand {
  constructor(
    public userId: number,
    public token: string,
  ) {}
}

@CommandHandler(LogOutCommand)
export class LogOutUseCase implements ICommandHandler<LogOutCommand> {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: LogOutCommand): Promise<ResultType<null>> {
    const { userId, token } = command;

    return this.prisma.$transaction(async (tx) => {
      const payload = await this.tokenService.verifyRefreshToken(token);
      const tokenIssuedAt = payload.issuedAt;

      const device = await this.deviceRepository.getDevice(
        payload.deviceId,
        tx,
      );

      if (!device)
        return new ErrorResult({
          code: InternalErrorCode.Unauthorized,
          extensions: [],
        });

      const deviceIssuedAt = device.issuedAt.toISOString();

      if (userId !== device.userId || tokenIssuedAt !== deviceIssuedAt)
        return new ErrorResult({
          code: InternalErrorCode.Unauthorized,
          extensions: [],
        });

      await this.deviceRepository.deleteDevice(device.id, tx);

      return new SuccessResult(null);
    });
  }
}
