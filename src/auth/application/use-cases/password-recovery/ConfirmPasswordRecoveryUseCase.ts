import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
  SuccessResult,
} from '../../../../libs/error-handling/result';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PasswordRecoveryRepository } from '../../../repositories/password-recovery/PasswordRecoveryRepository';
import { I18nAdapter } from '../../../../libs/i18n/i18n.adapter';

export class ConfirmPasswordRecoveryCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmPasswordRecoveryCommand)
export class ConfirmPasswordRecoveryUseCase
  implements ICommandHandler<ConfirmPasswordRecoveryCommand>
{
  constructor(
    private prisma: PrismaService,
    private i18nAdapter: I18nAdapter,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(
    command: ConfirmPasswordRecoveryCommand,
  ): Promise<ResultType<null>> {
    const { code } = command;

    return this.prisma.$transaction(async (tx) => {
      const recoveryData =
        await this.passwordRecoveryRepository.getRecoveryData(code, tx);

      // если обновление пароля уже подтверждено, кидаем ошибку
      if (recoveryData.isConfirmed) {
        const message = await this.i18nAdapter.getMessage('recoveryConfirm');
        const field = 'code';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      // если текущая дата после expirationDate, то код истек
      if (isAfter(new Date(), recoveryData.expirationDate)) {
        const message = await this.i18nAdapter.getMessage('codeExpired');
        const field = 'code';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      await this.passwordRecoveryRepository.confirmRecoveryPassword(
        recoveryData.userId,
        tx,
      );
      return new SuccessResult(null);
    });
  }
}
