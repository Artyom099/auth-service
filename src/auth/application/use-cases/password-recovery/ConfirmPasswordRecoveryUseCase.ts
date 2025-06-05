import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import { EntityManager } from 'typeorm';

import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
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

      if (!recoveryData) {
        throw new BadRequestException(`Password recovery recovery with code ${code} not found. You should start it`);
      }

      // если обновление пароля уже подтверждено, кидаем ошибку
      if (recoveryData.isConfirmed) {
        throw new BadRequestException(`Password recovery with code ${code} already confirmed`);
      }

      // если текущая дата после expirationDate, то код истек
      if (isAfter(new Date(), recoveryData.expirationDate)) {
        throw new BadRequestException(`Recovery code ${code} expired`);
      }

      await this.passwordRecoveryRepository.confirmRecoveryPassword(em, recoveryData.userId);

      return new SuccessResult(null);
    });
  }
}
