import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { add } from 'date-fns';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { randomUUID } from 'crypto';
import { SendEmailCommand } from '../../../../infrastructure/email/application/send.email.use.case';
import { Contract } from '../../../../infrastructure/contract/contract';
import {
  EmailEvent,
  InternalCode,
} from '../../../../infrastructure/utils/enums';
import { UpdateCodeDTO } from '../../api/models/dto/update.code.dto';

export class ResendEmailConfirmationCommand {
  constructor(public code: string) {}
}

@CommandHandler(ResendEmailConfirmationCommand)
export class ResendEmailConfirmationUseCase
  implements ICommandHandler<ResendEmailConfirmationCommand>
{
  constructor(
    private commandBus: CommandBus,
    private authRepository: AuthRepository,
  ) {}

  async execute(
    command: ResendEmailConfirmationCommand,
  ): Promise<Contract<null>> {
    const userResult = await this.authRepository.getUserByConfirmationCode(
      command.code,
    );
    if (userResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    const data: UpdateCodeDTO = {
      userId: userResult.payload.id,
      expirationDate: add(new Date(), { hours: 3 }),
      code: randomUUID(),
    };
    const updateResult = await this.authRepository.updateConfirmationData(data);
    if (updateResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    return this.commandBus.execute(
      new SendEmailCommand(
        EmailEvent.EmailConfirmation,
        userResult.payload.email,
        updateResult.payload.code,
      ),
    );
  }
}
