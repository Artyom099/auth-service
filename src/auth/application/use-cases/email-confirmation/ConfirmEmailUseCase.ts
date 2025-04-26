import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import { EntityManager } from 'typeorm';

import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
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
      const emailConfirmation = await this.emailConfirmationRepository.getByCode(em, code);

      if (!emailConfirmation) {
        throw new BadRequestException(`Confirmation code ${code} not found`);
      }

      // если почта уже подтверждена, кидаем ошибку
      if (emailConfirmation.isConfirmed) {
        throw new BadRequestException(`Email ${emailConfirmation.email} already confirmed`);
      }

      // если текущая дата после expirationDate, то код истек
      if (isAfter(new Date(), emailConfirmation.expirationDate)) {
        throw new BadRequestException('Confirmation code expired');
      }

      await this.emailConfirmationRepository.confirmEmail(em, emailConfirmation.userId);

      return new SuccessResult(null);
    });
  }
}
