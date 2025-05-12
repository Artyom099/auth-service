import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { isAfter } from 'date-fns';
import { EntityManager } from 'typeorm';

import { UpdatePasswordRequestDto } from '../../../../libs/dto/input/UpdatePasswordRequestDto';
import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { PasswordRecoveryRepository } from '../../../repositories';

export class UpdatePasswordCommand {
  constructor(public body: UpdatePasswordRequestDto) {}
}

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordUseCase implements ICommandHandler<UpdatePasswordCommand> {
  private readonly SALT_ROUNDS = 10;

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
        throw new BadRequestException('Password recovery not confirmed');
      }

      // если текущая дата после expirationDate, то код истек
      if (isAfter(new Date(), recoveryData.expirationDate)) {
        throw new BadRequestException('Recovery code has expired');
      }

      const passwordHash = await hash(newPassword, this.SALT_ROUNDS);

      // обновляем пароль
      await this.passwordRecoveryRepository.updatePassword(em, recoveryData.userId, passwordHash);

      return new SuccessResult(null);
    });
  }
}
