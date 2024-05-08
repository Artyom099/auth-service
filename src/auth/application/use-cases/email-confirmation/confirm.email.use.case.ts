import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
  SuccessResult,
} from '../../../../infrastructure/error-handling/result';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { EmailConfirmationRepository } from '../../../repositories/email-confirmation/email.confirmation.repository';
import { I18nAdapter } from '../../../../i18n/i18n.adapter';
import { UserRepository } from '../../../repositories/user/user.repository';

export class ConfirmEmailCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase
  implements ICommandHandler<ConfirmEmailCommand>
{
  constructor(
    private prisma: PrismaService,
    private i18nAdapter: I18nAdapter,
    private userRepository: UserRepository,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: ConfirmEmailCommand): Promise<ResultType<null>> {
    const { code } = command;

    return this.prisma.$transaction(async (tx) => {
      const confirmationData =
        await this.emailConfirmationRepository.getConfirmationDataByCode(
          code,
          tx,
        );

      // если почта уже подтверждена, кидаем ошибку
      if (confirmationData.isConfirmed) {
        const message = await this.i18nAdapter.getMessage('emailConfirm');
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      // если текущая дата после expirationDate, то код истек
      if (isAfter(new Date(), confirmationData.expirationDate)) {
        const message = await this.i18nAdapter.getMessage('codeExpired');
        const field = 'code';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      await this.emailConfirmationRepository.confirmEmail(
        confirmationData.userId,
        tx,
      );

      await this.userRepository.update(confirmationData.userId, {
        email: confirmationData.email,
        isEmailConfirmed: true,
      });

      return new SuccessResult(null);
    });
  }
}
