import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegistrationInputModel } from '../../api/models/input/registration.input.model';
import { CreateUserCommand } from '../user/create.user.use.case';
import { SendEmailCommand } from '../../../../infrastructure/email/application/send.email.use.case';
import { DeleteUserCommand } from '../user/delete.user.use.case';
import { Contract } from '../../../../infrastructure/contract/contract';
import {
  EmailEvent,
  InternalCode,
} from '../../../../infrastructure/utils/enums';

export class RegistrationCommand {
  constructor(public body: RegistrationInputModel) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase
  implements ICommandHandler<RegistrationCommand>
{
  constructor(private commandBus: CommandBus) {}

  async execute(command: RegistrationCommand): Promise<any> {
    const { login, email, password } = command.body;

    // todo - проверка уникальности login & email

    const userResult = await this.commandBus.execute(
      new CreateUserCommand(login, email, password),
    );
    if (userResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    const sendEmailResult = await this.commandBus.execute(
      new SendEmailCommand(
        EmailEvent.EmailConfirmation,
        email,
        userResult.payload.code,
      ),
    );

    if (sendEmailResult.hasError()) {
      await this.commandBus.execute(
        new DeleteUserCommand(userResult.payload.id),
      );
    }

    return sendEmailResult;
  }
}
