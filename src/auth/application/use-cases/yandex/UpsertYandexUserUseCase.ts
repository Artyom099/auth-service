import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { randomBytes } from 'crypto';

import { User, UserEmailConfirmation, YandexUser } from '../../../../libs/db/entity';
import { DeviceRepository } from '../../../repositories';
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

export interface YandexAuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@CommandHandler(UpsertYandexUserCommand)
export class UpsertYandexUserUseCase implements ICommandHandler<UpsertYandexUserCommand> {
  constructor(
    private manager: EntityManager,
    private tokenService: TokenService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: UpsertYandexUserCommand): Promise<YandexAuthResult> {
    const { yandexId, email, username, deviceName, ip } = command;

    return this.manager.transaction(async (em) => {
      // Ищем пользователя по yandexId
      const userByYandexlId = await em
        .createQueryBuilder(User, 'u')
        .select('uec.email', 'email')
        .innerJoin(YandexUser, 'yu', 'yu.userId = u.id')
        .innerJoin(UserEmailConfirmation, 'uec', 'uec.userId = u.id')
        .where('uec.email = :email', { email })
        .getRawOne<{ email: string }>();

      let user: User;

      // Если пользователя нет, создаем нового
      if (!userByYandexlId) {
        // Проверяем, не зарегистрирован ли уже пользователь с таким email
        const existingUser = await em
          .createQueryBuilder(User, 'u')
          .select('u.id', 'id')
          .addSelect('uec.email', 'email')
          .innerJoin(UserEmailConfirmation, 'uec', 'uec.userId = u.id')
          .where('uec.email = :email', { email })
          .getRawOne<{ id: string; email: string }>();

        if (existingUser) {
          // Если пользователь с таким email уже есть, связываем его с Яндекс-аккаунтом
          await em.save(
            em.create(YandexUser, {
              yandexId,
              userId: existingUser.id,
            }),
          );
        } else {
          // Создаем нового пользователя
          user = await em.save(
            em.create(User, {
              login: username,
              passwordHash: randomBytes(16).toString('base64'),
            }),
          );

          await em.save(
            em.create(UserEmailConfirmation, {
              userId: user.id,
              email,
              isConfirmed: true,
            }),
          );

          // связываем его с Яндекс-аккаунтом
          await em.save(
            em.create(YandexUser, {
              yandexId,
              userId: user.id,
            }),
          );
        }
      }

      const deviceId = uuidv4();
      const issuedAt = new Date();

      // Генерируем токены
      const { accessToken, refreshToken } = await this.tokenService.signTokens({
        userId: user.id,
        deviceId,
        issuedAt: issuedAt.toISOString(),
      });

      // Создаем устройство
      const deviceDto = {
        id: deviceId,
        userId: user.id,
        deviceName,
        ip,
        issuedAt,
      };
      await this.deviceRepository.createDevice(em, deviceDto);

      return { user, accessToken, refreshToken };
    });
  }
}
