import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import { EntityManager } from 'typeorm';

import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { PasswordRecoveryRepository } from '../../../repositories';

export class ConfirmPasswordRecoveryCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmPasswordRecoveryCommand)
export class ConfirmPasswordRecoveryUseCase implements ICommandHandler<ConfirmPasswordRecoveryCommand> {
  constructor(
    private manager: EntityManager,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: ConfirmPasswordRecoveryCommand): Promise<ResultType<null>> {
    const { code } = command;

    return this.manager.transaction(async (em) => {
      const recoveryData = await this.passwordRecoveryRepository.getRecoveryData(em, code);

      // если обновление пароля уже подтверждено, кидаем ошибку
      if (recoveryData.isConfirmed) {
        const message = 'Password recovery already confirmed';
        const field = 'code';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      // если текущая дата после expirationDate, то код истек
      if (isAfter(new Date(), recoveryData.expirationDate)) {
        const message = 'Recovery code has expired';
        const field = 'code';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      await this.passwordRecoveryRepository.confirmRecoveryPassword(em, recoveryData.userId);

      return new SuccessResult(null);
    });
  }
}
