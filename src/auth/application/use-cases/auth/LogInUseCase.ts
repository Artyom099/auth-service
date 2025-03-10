import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../repositories/user/UserRepository';
import { LogInDTO } from '../../../api/models/dto/log.in.dto';
import { CreateDeviceDTO } from '../../../api/models/dto/create.device.dto';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
  SuccessResult,
} from '../../../../libs/error-handling/result';
import { I18nAdapter } from '../../../../libs/i18n/i18n.adapter';
import { DeviceRepository } from '../../../repositories/device/DeviceRepository';
import { PairTokensType } from '../../../api/models/dto/pair.tokens.type';

export class LogInCommand {
  constructor(public dto: LogInDTO) {}
}

@CommandHandler(LogInCommand)
export class LogInUseCase implements ICommandHandler<LogInCommand> {
  constructor(
    private prisma: PrismaService,
    private i18nAdapter: I18nAdapter,
    private authService: AuthService,
    private tokenService: TokenService,
    private userRepository: UserRepository,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: LogInCommand): Promise<ResultType<PairTokensType>> {
    const { email, password, deviceName, ip } = command.dto;

    return this.prisma.$transaction(async (tx) => {
      const user = await this.userRepository.getUserByLoginOrEmail(email, tx);

      if (!user) {
        const message = await this.i18nAdapter.getMessage('wrongLogin');
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      if (!user.isEmailConfirmed) {
        const message = await this.i18nAdapter.getMessage('emailNotConfirm');
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const validationResult = await this.authService.validateUser(
        email,
        password,
        user.passwordHash,
        tx,
      );

      if (validationResult.hasError) return validationResult;

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
