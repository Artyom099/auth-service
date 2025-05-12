import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TYandexCallbackResponseDto } from 'src/libs/dto';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { randomBytes } from 'crypto';

import { DeviceRepository, EmailConfirmationRepository, UserRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class UpsertYandexUserCommand {
  constructor(
    public readonly yandexId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly provider: string,
    public readonly deviceName: string,
    public readonly ip: string,
  ) {}
}

@CommandHandler(UpsertYandexUserCommand)
export class UpsertYandexUserUseCase implements ICommandHandler<UpsertYandexUserCommand> {
  constructor(
    private manager: EntityManager,
    private tokenService: TokenService,
    private deviceRepository: DeviceRepository,
    private userRepository: UserRepository,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: UpsertYandexUserCommand): Promise<TYandexCallbackResponseDto> {
    const { yandexId, email, username, deviceName, ip } = command;

    return this.manager.transaction(async (em) => {
      // Ищем пользователя по yandexId
      const userByYandex = await this.userRepository.getUserCreatedByYandex(em, email);

      let userId: string = userByYandex?.id;

      // Если пользователя нет, создаем нового
      if (!userByYandex) {
        // Проверяем, не зарегистрирован ли уже пользователь с таким email
        const existingUser = await this.userRepository.getExistingYandexUser(em, email);

        if (existingUser) {
          // Если пользователь с таким email уже есть, связываем его с Яндекс-аккаунтом
          userId = existingUser.id;
          await this.userRepository.createYandexUser(em, { yandexId, userId });
        } else {
          // Создаем нового пользователя
          const user = await this.userRepository.create(em, {
            login: username,
            passwordHash: randomBytes(16).toString('base64'),
          });
          userId = user.id;

          await this.emailConfirmationRepository.create(em, {
            userId: user.id,
            email,
            isConfirmed: true,
          });

          // связываем его с Яндекс-аккаунтом
          await this.userRepository.createYandexUser(em, { yandexId, userId });
        }
      }

      const deviceId = uuidv4();
      const issuedAt = new Date();

      // Генерируем токены
      const { accessToken, refreshToken } = await this.tokenService.signTokens({
        userId,
        deviceId,
        issuedAt: issuedAt.toISOString(),
      });

      // Создаем устройство
      const deviceDto = {
        id: deviceId,
        userId,
        deviceName,
        ip,
        issuedAt,
      };
      await this.deviceRepository.createDevice(em, deviceDto);

      return { userId, accessToken, refreshToken };
    });
  }
}
