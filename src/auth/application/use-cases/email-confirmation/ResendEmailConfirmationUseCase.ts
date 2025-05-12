import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { EntityManager } from 'typeorm';

import { randomUUID } from 'crypto';

import { UpdateCodeDto } from '../../../../libs/dto/UpdateCodeDto';
import { ErrorResult, InternalErrorCode, ResultType } from '../../../../libs/error-handling/result';
import { EmailConfirmationRepository, UserRepository } from '../../../repositories';
import { EmailService } from '../../services';

export class ResendEmailConfirmationCommand {
  constructor(public email: string) {}
}

@CommandHandler(ResendEmailConfirmationCommand)
export class ResendEmailConfirmationUseCase implements ICommandHandler<ResendEmailConfirmationCommand> {
  constructor(
    private manager: EntityManager,
    private emailService: EmailService,
    private userRepository: UserRepository,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: ResendEmailConfirmationCommand): Promise<ResultType<null>> {
    const { email } = command;

    return this.manager.transaction(async (em) => {
      // смотрим, есть ли пользователь с такой почтой
      const user = await this.userRepository.getUserByLoginOrEmail(em, email);

      // если пользователя нет, кидаем ошибку
      if (!user) {
        const message = 'Email does not exist';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const confirmationData = await this.emailConfirmationRepository.getByEmail(em, email);

      // если почта уже подтверждена, кидаем ошибку
      if (confirmationData.isConfirmed) {
        const message = 'Email already confirmed';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const dto: UpdateCodeDto = {
        userId: user.id,
        expirationDate: add(new Date(), { hours: 3 }).toISOString(),
        confirmationCode: randomUUID(),
      };

      const newCode = await this.emailConfirmationRepository.updateConfirmationData(em, dto);

      return this.emailService.sendEmailConfirmationMessage(user.email, newCode);
    });
  }
}
