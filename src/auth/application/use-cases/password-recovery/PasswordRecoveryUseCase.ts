import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { EntityManager } from 'typeorm';

import { UpdateRecoveryCodeDto } from '../../../../libs/dto/UpdateRecoveryCodeDto';
import { ResultType } from '../../../../libs/error-handling/result';
import { generateConfirmationCode } from '../../../../libs/utils';
import { PasswordRecoveryRepository, UserRepository } from '../../../repositories';
import { EmailService } from '../../services';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<PasswordRecoveryCommand> {
  constructor(
    private manager: EntityManager,
    private emailService: EmailService,
    private userRepository: UserRepository,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<ResultType<null>> {
    const { email } = command;

    return this.manager.transaction(async (em) => {
      const user = await this.userRepository.getUserByLoginOrEmail(em, email);

      // если нет пользователя с таким email, кидаем ошибку
      if (!user) {
        throw new BadRequestException(`Email ${email} not found`);
      }

      const dto: UpdateRecoveryCodeDto = {
        userId: user.id,
        expirationDate: add(new Date(), { hours: 2 }),
        recoveryCode: generateConfirmationCode(),
      };

      const passwordRecovery = await this.passwordRecoveryRepository.upsertPasswordRecovery(em, dto);

      return this.emailService.sendPasswordRecoveryMessage(email, passwordRecovery.recoveryCode);
    });
  }
}
