import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { isAfter } from 'date-fns';

import { PrismaService } from '../../../../../prisma/prisma.service';
import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { UpdatePasswordInputModel } from '../../../api/models/input/update.password.input.model';
import { PasswordRecoveryRepository } from '../../../repositories';

export class UpdatePasswordCommand {
  constructor(public body: UpdatePasswordInputModel) {}
}

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordUseCase implements ICommandHandler<UpdatePasswordCommand> {
  private readonly SALT_ROUNDS: 10;

  constructor(
    private prisma: PrismaService,

    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<ResultType<null>> {
    const { newPassword, recoveryCode } = command.body;

    return this.prisma.$transaction(async (tx) => {
      const recoveryData = await this.passwordRecoveryRepository.getRecoveryData(recoveryCode, tx);

      // если обновление пароля еще НЕ подтверждено с почты, кидаем ошибку
      if (!recoveryData.isConfirmed) {
        const message = 'Password recovery not confirmed';
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

      const passwordHash = await hash(newPassword, this.SALT_ROUNDS);

      // обновляем пароль
      await this.passwordRecoveryRepository.updatePassword(recoveryData.userId, passwordHash, tx);

      return new SuccessResult(null);
    });
  }
}
