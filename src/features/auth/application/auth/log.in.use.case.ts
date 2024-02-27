import { JwtService } from '@nestjs/jwt';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { LogInDTO } from '../../api/models/dto/log.in.dto';
import { ValidateUserCommand } from './validate.user.use.case';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';
import { CreateDeviceCommand } from '../../../device/application/create.device.use.case';

export class LogInCommand {
  constructor(public dto: LogInDTO) {}
}

@CommandHandler(LogInCommand)
export class LogInUseCase implements ICommandHandler<LogInCommand> {
  constructor(
    private commandBus: CommandBus,
    private jwtService: JwtService,
    private authRepository: AuthRepository,
  ) {}

  async execute(command: LogInCommand): Promise<any> {
    const { email, password, deviceName, ip } = command.dto;

    const userResult = await this.authRepository.getUserByCredentials(email);
    if (userResult.hasError()) return new Contract(InternalCode.Unauthorized);

    const validationResult = await this.commandBus.execute(
      new ValidateUserCommand(email, password, userResult.payload.passwordHash),
    );
    if (validationResult.hasError()) return validationResult;

    const createDeviceResult = await this.commandBus.execute(
      new CreateDeviceCommand(userResult.payload.id, ip, deviceName),
    );
    if (createDeviceResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    const accessToken = await this.jwtService.signAsync(
      { userId: userResult.payload.id },
      { expiresIn: '30m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        userId: userResult.payload.id,
        deviceId: createDeviceResult.payload.deviceId,
      },
      { expiresIn: '200m' },
    );

    return new Contract(InternalCode.Success, { accessToken, refreshToken });
  }
}
