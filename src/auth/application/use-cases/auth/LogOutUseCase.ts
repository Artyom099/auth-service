import { UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { DeviceRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class LogOutCommand {
  constructor(
    public userId: string,
    public token: string,
  ) {}
}

@CommandHandler(LogOutCommand)
export class LogOutUseCase implements ICommandHandler<LogOutCommand> {
  constructor(
    private manager: EntityManager,
    private tokenService: TokenService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: LogOutCommand): Promise<ResultType<null>> {
    const { userId, token } = command;

    return this.manager.transaction(async (em) => {
      const payload = await this.tokenService.verifyRefreshToken(token);
      const tokenIssuedAt = payload.issuedAt;

      const device = await this.deviceRepository.getDevice(em, payload.deviceId);

      if (!device) {
        throw new UnauthorizedException(`Current device ${payload.deviceId} not found`);
      }

      const deviceIssuedAt = device.issuedAt.toISOString();

      if (userId !== device.userId || tokenIssuedAt !== deviceIssuedAt) {
        throw new UnauthorizedException('UserId or issuedAt in token and device does not match');
      }

      await this.deviceRepository.deleteDevice(em, device.id);

      return new SuccessResult(null);
    });
  }
}
