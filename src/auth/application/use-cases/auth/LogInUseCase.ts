import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { randomUUID } from 'crypto';

import { PrismaService } from '../../../../../prisma/prisma.service';
import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { CreateDeviceDTO } from '../../../api/models/dto/create.device.dto';
import { LogInDTO } from '../../../api/models/dto/log.in.dto';
import { PairTokensType } from '../../../api/models/dto/pair.tokens.type';
import { DeviceRepository, UserTypeOrmRepository } from '../../../repositories';
import { AuthService } from '../../services';
import { TokenService } from '../../services';

export class LogInCommand {
  constructor(public dto: LogInDTO) {}
}

@CommandHandler(LogInCommand)
export class LogInUseCase implements ICommandHandler<LogInCommand> {
  constructor(
    private prisma: PrismaService,
    private manager: EntityManager,
    private authService: AuthService,
    private tokenService: TokenService,
    private userRepository: UserTypeOrmRepository,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: LogInCommand): Promise<ResultType<PairTokensType>> {
    const { email, password, deviceName, ip } = command.dto;

    return this.manager.transaction(async (em) => {
      const user = await this.userRepository.getUserByLoginOrEmail(em, email);

      if (!user) {
        const message = 'Wrong login or email';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      if (!user.isConfirmed) {
        const message = 'Email not confirmed';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const validationResult = await this.authService.validateUser(email, password, user.passwordHash, tx);

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

      const dto: CreateDeviceDTO = {
        id: deviceId,
        userId,
        ip,
        deviceName,
        issuedAt,
      };
      await this.deviceRepository.createDevice(dto, tx);

      return new SuccessResult({ accessToken, refreshToken });
    });
  }
}
