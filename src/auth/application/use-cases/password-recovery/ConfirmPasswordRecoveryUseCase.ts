import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';

import { PrismaService } from '../../../../../prisma/prisma.service';
import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { PasswordRecoveryRepository } from '../../../repositories';

export class ConfirmPasswordRecoveryCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmPasswordRecoveryCommand)
export class ConfirmPasswordRecoveryUseCase implements ICommandHandler<ConfirmPasswordRecoveryCommand> {
  constructor(
    private prisma: PrismaService,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: ConfirmPasswordRecoveryCommand): Promise<ResultType<null>> {
    const { code } = command;

    return this.prisma.$transaction(async (tx) => {
      const recoveryData = await this.passwordRecoveryRepository.getRecoveryData(code, tx);

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

      await this.passwordRecoveryRepository.confirmRecoveryPassword(recoveryData.userId, tx);
      return new SuccessResult(null);
    });
  }
}
