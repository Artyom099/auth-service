import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { randomUUID } from 'crypto';

import { CreateDeviceDto } from '../../../../libs/dto/createDeviceDto';
import { LogInDto } from '../../../../libs/dto/LogInDto';
import { PairTokensType } from '../../../../libs/dto/pair.tokens.type';
import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { DeviceRepository, UserRepository } from '../../../repositories';
import { AuthService, TokenService } from '../../services';

export class LogInCommand {
  constructor(public dto: LogInDto) {}
}

@CommandHandler(LogInCommand)
export class LogInUseCase implements ICommandHandler<LogInCommand> {
  constructor(
    private manager: EntityManager,
    private authService: AuthService,
    private tokenService: TokenService,
    private userRepository: UserRepository,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: LogInCommand): Promise<ResultType<PairTokensType>> {
    const { email, password, deviceName, ip } = command.dto;

    return this.manager.transaction(async (em) => {
      const user = await this.userRepository.getUserByLoginOrEmail(em, email);

      if (!user) {
        throw new BadRequestException(`User not found by email ${email}`);
      }

      if (!user.isConfirmed) {
        throw new BadRequestException(`Email ${email} not confirmed`);
      }

      const validationResult = await this.authService.validateUser(em, email, password, user.passwordHash);

      if (validationResult.hasError) {
        return validationResult;
      }

      const deviceId = randomUUID();
      const issuedAt = new Date();
      const userId = user.id;

      const { accessToken, refreshToken } = await this.tokenService.signTokens({
        userId,
        deviceId,
        issuedAt: issuedAt.toISOString(),
      });

      const dto: CreateDeviceDto = {
        id: deviceId,
        userId,
        ip,
        deviceName,
        issuedAt,
      };
      await this.deviceRepository.createDevice(em, dto);

      return new SuccessResult({ accessToken, refreshToken });
    });
  }
}
