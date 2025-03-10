import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationInputModel } from '../../../api/models/input/registration.input.model';
import { UserRepository } from '../../../repositories/user/UserRepository';
import { hash } from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { add } from 'date-fns';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
} from '../../../../libs/error-handling/result';
import { EmailService } from '../../services/email.service';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { I18nAdapter } from '../../../../libs/i18n/i18n.adapter';
import { EmailConfirmationRepository } from '../../../repositories/email-confirmation/EmailConfirmationRepository';

export class RegistrationCommand {
  constructor(public body: RegistrationInputModel) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase
  implements ICommandHandler<RegistrationCommand>
{
  private readonly SALT_ROUND: number = 10;

  constructor(
    private prisma: PrismaService,
    private i18nAdapter: I18nAdapter,
    private emailService: EmailService,
    private userRepository: UserRepository,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: RegistrationCommand): Promise<ResultType<null>> {
    const { login, email, password } = command.body;

    return this.prisma.$transaction(async (tx) => {
      // проверка уникальности login & email
      const userByEmail = await this.userRepository.getUserByLoginOrEmail(
        email,
        tx,
      );

      if (userByEmail) {
        const message = await this.i18nAdapter.getMessage('emailExist');
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const userByLogin = await this.userRepository.getUserByLoginOrEmail(
        login,
        tx,
      );
      if (userByLogin) {
        const message = await this.i18nAdapter.getMessage('loginExist');
        const field = 'login';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const passwordHash = await hash(password, this.SALT_ROUND);
      const data: Prisma.UserCreateInput = {
        login,
        passwordHash,
      };
      const expirationDate = add(new Date(), { hours: 1 });

      const user = await this.userRepository.create({ ...data }, tx);

      const emailConfirmation = await this.emailConfirmationRepository.create(
        { expirationDate, email, userId: user.id },
        tx,
      );

      try {
        const sendEmailResult =
          await this.emailService.sendEmailConfirmationMessage(
            email,
            emailConfirmation.confirmationCode,
          );

        if (sendEmailResult.hasError)
          await this.userRepository.deleteUser(user.id, tx);

        return sendEmailResult;
      } catch (e) {
        console.log({ reg_use_case_err: e });
      }
    });
  }
}
