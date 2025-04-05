import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';

import { randomUUID } from 'crypto';

import { PrismaService } from '../../../../../prisma/prisma.service';
import { I18nAdapter } from '../../../../libs';
import { ErrorResult, InternalErrorCode, ResultType } from '../../../../libs/error-handling/result';
import { UpdateCodeDTO } from '../../../api/models/dto/update.code.dto';
import { EmailConfirmationRepository } from '../../../repositories';
import { UserRepository } from '../../../repositories';
import { EmailService } from '../../services';

export class ResendEmailConfirmationCommand {
  constructor(public email: string) {}
}

@CommandHandler(ResendEmailConfirmationCommand)
export class ResendEmailConfirmationUseCase implements ICommandHandler<ResendEmailConfirmationCommand> {
  constructor(
    private prisma: PrismaService,
    private i18nAdapter: I18nAdapter,
    private emailService: EmailService,
    private userRepository: UserRepository,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: ResendEmailConfirmationCommand): Promise<ResultType<null>> {
    const { email } = command;

    return this.prisma.$transaction(async (tx) => {
      // смотрим, есть ли пользователь с такой почтой
      const user = await this.userRepository.getUserByLoginOrEmail(email, tx);

      // если пользователя нет, кидаем ошибку
      if (!user) {
        const message = await this.i18nAdapter.getMessage('emailNotExist');
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const confirmationData = await this.emailConfirmationRepository.getConfirmationDataByEmail(email, tx);

      // если почта уже подтверждена, кидаем ошибку
      if (confirmationData.isConfirmed) {
        const message = await this.i18nAdapter.getMessage('emailConfirm');
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const data: UpdateCodeDTO = {
        userId: user.id,
        expirationDate: add(new Date(), { hours: 3 }),
        code: randomUUID(),
      };

      const newCode = await this.emailConfirmationRepository.updateConfirmationData(data, tx);

      return this.emailService.sendEmailConfirmationMessage(user.email, newCode);
    });
  }
}
