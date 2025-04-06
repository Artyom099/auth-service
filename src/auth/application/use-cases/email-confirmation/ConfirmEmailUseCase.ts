import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import { EntityManager } from 'typeorm';

import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { EmailConfirmationRepository } from '../../../repositories';

export class ConfirmEmailCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase implements ICommandHandler<ConfirmEmailCommand> {
  constructor(
    private manager: EntityManager,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: ConfirmEmailCommand): Promise<ResultType<null>> {
    const { code } = command;

    return this.manager.transaction(async (em) => {
      const emailConfirmation = await this.emailConfirmationRepository.getConfirmationDataByCode(em, code);

      // если почта уже подтверждена, кидаем ошибку
      if (emailConfirmation.isConfirmed) {
        const message = 'Email already confirmed';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      // если текущая дата после expirationDate, то код истек
      if (isAfter(new Date(), emailConfirmation.expirationDate)) {
        const message = 'Confirmation code has expired';
        const field = 'code';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      await this.emailConfirmationRepository.confirmEmail(em, emailConfirmation.userId);

      // await this.userRepository.update(em, emailConfirmation.userId, {
      //   email: emailConfirmation.email,
      //   isEmailConfirmed: true,
      // });

      return new SuccessResult(null);
    });
  }
}
