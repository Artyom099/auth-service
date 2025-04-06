import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { PrismaService } from '../../../../../prisma/prisma.service';
import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { PairTokensType } from '../../../api/models/dto/pair.tokens.type';
import { DeviceRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class RefreshSessionCommand {
  constructor(public token: string) {}
}

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionUseCase implements ICommandHandler<RefreshSessionCommand> {
  constructor(
    private prisma: PrismaService,
    private manager: EntityManager,
    private tokenService: TokenService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<ResultType<PairTokensType>> {
    const { token } = command;

    return this.prisma.$transaction(async (tx) => {
      const payload = await this.tokenService.verifyRefreshToken(token);
      const { userId, deviceId, issuedAt } = payload;

      const device = await this.deviceRepository.getDevice(deviceId, tx);

      if (!device)
        return new ErrorResult({
          code: InternalErrorCode.Unauthorized,
          extensions: [],
        });

      const deviceIssuedAt = device.issuedAt.toISOString();

      if (userId !== device.userId || issuedAt !== deviceIssuedAt)
        return new ErrorResult({
          code: InternalErrorCode.Unauthorized,
          extensions: [],
        });

      const newIssuedAt = new Date();

      const { accessToken, refreshToken } = await this.tokenService.signTokens({
        userId,
        deviceId,
        issuedAt: newIssuedAt.toISOString(),
      });

      await this.deviceRepository.updateIssuedAt(device.id, newIssuedAt, tx);

      return new SuccessResult({ accessToken, refreshToken });
    });
  }
}
