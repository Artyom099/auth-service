import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { generateConfirmationCode } from '../../../../libs/utils';
import { EmailConfirmationRepository, UserRepository } from '../../../repositories';
import { TokenService, VkOauthService } from '../../services';

export class VkOauthCommand {
  constructor(
    public readonly code: string,
    public readonly ip: string,
  ) {}
}

@CommandHandler(VkOauthCommand)
export class VkOauthUseCase implements ICommandHandler<VkOauthCommand> {
  constructor(
    private readonly vkOauthService: VkOauthService,
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly manager: EntityManager,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: VkOauthCommand): Promise<ResultType<any>> {
    return this.manager.transaction(async (em) => {
      const { code } = command;

      // Получаем информацию о пользователе из VK
      const vkUserInfo = await this.vkOauthService.getVkUserInfo(code);
      if (vkUserInfo.hasError) {
        return vkUserInfo;
      }

      const { id, email } = vkUserInfo.payload;

      // Проверяем, существует ли пользователь
      let user = await this.userRepository.getUserByVkId(em, id);

      if (!user) {
        // Создаем нового пользователя
        user = await this.userRepository.create(em, {
          login: Math.random().toString(36).substring(2, 15),
          passwordHash: generateConfirmationCode(),
        });

        await this.userRepository.createVkUser(em, user.id, id);

        await this.emailConfirmationRepository.create(em, {
          email,
          userId: user.id,
          isConfirmed: true,
        });
      }

      // Генерируем токены
      const tokens = await this.tokenService.signTokens({
        userId: user.id,
        deviceId: 'vk-oauth-mock',
        issuedAt: new Date().toISOString(),
      });

      return new SuccessResult(tokens);
    });
  }
}
