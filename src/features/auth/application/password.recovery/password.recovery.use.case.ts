import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { add } from 'date-fns';
import { randomUUID } from 'crypto';
import { UpdateCodeDTO } from '../../api/models/dto/update.code.dto';
import { SendEmailCommand } from '../../../../infrastructure/email/application/send.email.use.case';
import { Contract } from '../../../../infrastructure/contract/contract';
import {
  EmailEvent,
  InternalCode,
} from '../../../../infrastructure/utils/enums';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private commandBus: CommandBus,
    private authRepository: AuthRepository,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<Contract<null>> {
    const { email } = command;

    const userResult = await this.authRepository.getUserByCredentials(email);
    if (userResult.code === InternalCode.NotFound)
      return new Contract(InternalCode.Success);

    const data: UpdateCodeDTO = {
      userId: userResult.payload.id,
      expirationDate: add(new Date(), { hours: 3 }),
      code: randomUUID(),
    };

    const createRecoveryDataResult =
      await this.authRepository.upsertRecoveryData(data);

    if (createRecoveryDataResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    return this.commandBus.execute(
      new SendEmailCommand(
        EmailEvent.PasswordRecovery,
        email,
        createRecoveryDataResult.payload.recoveryCode,
      ),
    );
  }
}
