import { InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { add } from 'date-fns';
import { User } from 'src/libs/db/entity';
import { DeepPartial, EntityManager } from 'typeorm';

import { ErrorResult, InternalErrorCode, ResultType } from '../../../../libs/error-handling/result';
import { RegistrationInputModel } from '../../../api/models/input/registration.input.model';
import { UserTypeOrmRepository, EmailConfirmationRepository } from '../../../repositories';
import { EmailService } from '../../services';

export class RegistrationCommand {
  constructor(public body: RegistrationInputModel) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase implements ICommandHandler<RegistrationCommand> {
  private readonly SALT_ROUND: number = 10;

  constructor(
    private manager: EntityManager,
    private emailService: EmailService,
    private userRepository: UserTypeOrmRepository,
    private emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: RegistrationCommand): Promise<ResultType<null>> {
    const { login, email, password } = command.body;

    return this.manager.transaction(async (em) => {
      // проверка уникальности login & email
      const isEmailExist = await this.userRepository.isUserExistByLoginOrEmail(em, email);
      if (isEmailExist) {
        const message = 'Email already exists';
        const field = 'email';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const isLoginExist = await this.userRepository.isUserExistByLoginOrEmail(em, login);
      if (isLoginExist) {
        const message = 'Login already exists';
        const field = 'login';

        return new ErrorResult({
          code: InternalErrorCode.BadRequest,
          extensions: [{ field, message }],
        });
      }

      const passwordHash = await hash(password, this.SALT_ROUND);
      const dto: DeepPartial<User> = {
        login,
        passwordHash,
      };
      const expirationDate = add(new Date(), { hours: 1 });

      const userId = await this.userRepository.create(em, dto);

      const emailConfirmation = await this.emailConfirmationRepository.create(em, { expirationDate, email, userId });

      try {
        const sendEmailResult = await this.emailService.sendEmailConfirmationMessage(
          email,
          emailConfirmation.confirmationCode,
        );

        if (sendEmailResult.hasError) {
          await this.emailConfirmationRepository.delete(em, userId);
          await this.userRepository.delete(em, userId);
        }

        return sendEmailResult;
      } catch (e) {
        console.log({ RegistrationError: e });
        throw new InternalServerErrorException({ RegistrationError: e });
      }
    });
  }
}
