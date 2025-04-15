import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { UpdateRecoveryCodeDto } from 'src/auth/api/models/dto/UpdateRecoveryCodeDto';
import { EntityManager } from 'typeorm';

import { randomUUID } from 'crypto';

import { ErrorResult, InternalErrorCode, ResultType } from '../../../../libs/error-handling/result';
import { PasswordRecoveryRepository, UserTypeOrmRepository } from '../../../repositories';
import { EmailService } from '../../services';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<PasswordRecoveryCommand> {
  constructor(
    private manager: EntityManager,
    private emailService: EmailService,
    private userRepository: UserTypeOrmRepository,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<ResultType<null>> {
    const { email } = command;

    return this.manager.transaction(async (em) => {
      const user = await this.userRepository.getUserByLoginOrEmail(em, email);

      // если нет пользователя с таким email, кидаем ошибку
      if (!user) {
        const message = 'Email is not registered';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const dto: UpdateRecoveryCodeDto = {
        userId: user.id,
        expirationDate: add(new Date(), { hours: 2 }).toISOString(),
        recoveryCode: randomUUID(),
      };

      const passwordRecovery = await this.passwordRecoveryRepository.upsertPasswordRecovery(em, dto);

      return this.emailService.sendPasswordRecoveryMessage(email, passwordRecovery.recoveryCode);
    });
  }
}
