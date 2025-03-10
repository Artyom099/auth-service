import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../repositories/user/UserRepository';
import { add } from 'date-fns';
import { randomUUID } from 'crypto';
import { UpdateCodeDTO } from '../../../api/models/dto/update.code.dto';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
} from '../../../../libs/error-handling/result';
import { EmailService } from '../../services/email.service';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { PasswordRecoveryRepository } from '../../../repositories/password-recovery/PasswordRecoveryRepository';
import { I18nAdapter } from '../../../../libs/i18n/i18n.adapter';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private prisma: PrismaService,
    private i18nAdapter: I18nAdapter,
    private emailService: EmailService,
    private userRepository: UserRepository,
    private passwordRecoveryRepository: PasswordRecoveryRepository,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<ResultType<null>> {
    const { email } = command;

    return this.prisma.$transaction(async (tx) => {
      const user = await this.userRepository.getUserByLoginOrEmail(email, tx);

      // если нет пользователя с таким email, кидаем ошибку
      if (!user) {
        const message = await this.i18nAdapter.getMessage('emailNotRegister');
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const data: UpdateCodeDTO = {
        userId: user.id,
        expirationDate: add(new Date(), { hours: 2 }),
        code: randomUUID(),
      };

      const recoveryData =
        await this.passwordRecoveryRepository.upsertRecoveryData(data, tx);

      return this.emailService.sendPasswordRecoveryMessage(
        email,
        recoveryData.recoveryCode,
      );
    });
  }
}
