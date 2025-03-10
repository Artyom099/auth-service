import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { isAfter } from 'date-fns';
import { UpdatePasswordInputModel } from '../../../api/models/input/update.password.input.model';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
  SuccessResult,
} from '../../../../libs/error-handling/result';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PasswordRecoveryRepository } from '../../../repositories/password-recovery/PasswordRecoveryRepository';
import { I18nAdapter } from '../../../../libs/i18n/i18n.adapter';

export class UpdatePasswordCommand {
  constructor(public body: UpdatePasswordInputModel) {}
}

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordUseCase
  implements ICommandHandler<UpdatePasswordCommand>
{
  private readonly SALT_ROUNDS: 10;

  constructor(
    private prisma: PrismaService,
    private i18nAdapter: I18nAdapter,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<ResultType<null>> {
    const { newPassword, recoveryCode } = command.body;

    return this.prisma.$transaction(async (tx) => {
      const recoveryData =
        await this.passwordRecoveryRepository.getRecoveryData(recoveryCode, tx);

      // если обновление пароля еще НЕ подтверждено с почты, кидаем ошибку
      if (!recoveryData.isConfirmed) {
        const message = await this.i18nAdapter.getMessage('recoveryNotConfirm');
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

      const passwordHash = await hash(newPassword, this.SALT_ROUNDS);

      // обновляем пароль
      await this.passwordRecoveryRepository.updatePassword(
        recoveryData.userId,
        passwordHash,
        tx,
      );

      return new SuccessResult(null);
    });
  }
}
