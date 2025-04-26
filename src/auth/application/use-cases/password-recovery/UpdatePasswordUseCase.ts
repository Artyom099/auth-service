import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { isAfter } from 'date-fns';
import { EntityManager } from 'typeorm';

import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { UpdatePasswordRequestDto } from '../../../api/models/input/UpdatePasswordRequestDto';
import { PasswordRecoveryRepository } from '../../../repositories';

export class UpdatePasswordCommand {
  constructor(public body: UpdatePasswordRequestDto) {}
}

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordUseCase implements ICommandHandler<UpdatePasswordCommand> {
  private readonly SALT_ROUNDS: 10;

  constructor(
    private manager: EntityManager,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: UpdatePasswordCommand): Promise<ResultType<null>> {
    const { newPassword, recoveryCode } = command.body;

    return this.manager.transaction(async (em) => {
      const recoveryData = await this.passwordRecoveryRepository.getRecoveryData(em, recoveryCode);

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
      await this.passwordRecoveryRepository.updatePassword(em, recoveryData.userId, passwordHash);

      return new SuccessResult(null);
    });
  }
}
