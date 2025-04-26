import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { add } from 'date-fns';
import { User } from 'src/libs/db/entity';
import { DeepPartial, EntityManager } from 'typeorm';

import { ErrorResult } from '../../../../libs/error-handling/result';
import { generateConfirmationCode } from '../../../../libs/utils';
import { RegistrationRequestDto } from '../../../api/models/input/RegistrationRequestDto';
import { EmailConfirmationRepository, UserTypeOrmRepository } from '../../../repositories';
import { EmailService } from '../../services';

export class RegistrationCommand {
  constructor(public body: RegistrationRequestDto) {}
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

  async execute(command: RegistrationCommand): Promise<{ userId: string } | ErrorResult> {
    const { login, email, password } = command.body;

    return this.manager.transaction(async (em) => {
      // проверка уникальности login и email
      const isEmailExist = await this.userRepository.isUserExistByLoginOrEmail(em, email);
      if (isEmailExist) {
        throw new BadRequestException(`Email ${email} already exists`);
      }

      const isLoginExist = await this.userRepository.isUserExistByLoginOrEmail(em, login);
      if (isLoginExist) {
        throw new BadRequestException(`Login ${login} already exists`);
      }

      const passwordHash = await hash(password, this.SALT_ROUND);
      const dto: DeepPartial<User> = {
        login,
        passwordHash,
      };
      const expirationDate = add(new Date(), { hours: 1 });

      const user = await this.userRepository.create(em, dto);

      const confirmationCode = generateConfirmationCode();

      const emailConfirmation = await this.emailConfirmationRepository.create(em, {
        confirmationCode,
        expirationDate,
        email,
        userId: user.id,
      });

      try {
        const sendEmailResult = await this.emailService.sendEmailConfirmationMessage(
          email,
          emailConfirmation.confirmationCode,
        );

        if (sendEmailResult.hasError) {
          await this.emailConfirmationRepository.delete(em, user.id);
          await this.userRepository.delete(em, user.id);
        }
      } catch (e) {
        console.log({ RegistrationError: e });
        throw new InternalServerErrorException(`Registration error: ${e}`);
      }

      return { userId: user.id };
    });
  }
}
