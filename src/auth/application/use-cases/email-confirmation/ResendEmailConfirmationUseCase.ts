import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { EntityManager } from 'typeorm';

import { randomUUID } from 'crypto';

import { ErrorResult, InternalErrorCode, ResultType } from '../../../../libs/error-handling/result';
import { UpdateCodeDTO } from '../../../api/models/dto/update.code.dto';
import { EmailConfirmationRepository } from '../../../repositories';
import { UserTypeOrmRepository } from '../../../repositories';
import { EmailService } from '../../services';

export class ResendEmailConfirmationCommand {
  constructor(public email: string) { }
}

@CommandHandler(ResendEmailConfirmationCommand)
export class ResendEmailConfirmationUseCase implements ICommandHandler<ResendEmailConfirmationCommand> {
  constructor(
    private manager: EntityManager,
    private emailService: EmailService,
    private userRepository: UserTypeOrmRepository,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) { }

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

      const confirmationData = await this.emailConfirmationRepository.getConfirmationDataByEmail(em, email);

      // если почта уже подтверждена, кидаем ошибку
      if (confirmationData.isConfirmed) {
        const message = 'Email already confirmed';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const dto: UpdateCodeDTO = {
        userId: user.id,
        expirationDate: add(new Date(), { hours: 3 }),
        confirmationCode: randomUUID(),
      };

      const newCode = await this.emailConfirmationRepository.updateConfirmationData(em, dto);

      return this.emailService.sendEmailConfirmationMessage(user.email, newCode);
    });
  }
}
