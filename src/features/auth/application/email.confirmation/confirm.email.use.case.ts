import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';

export class ConfirmEmailCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase
  implements ICommandHandler<ConfirmEmailCommand>
{
  constructor(private authRepository: AuthRepository) {}

  async execute(command: ConfirmEmailCommand): Promise<Contract<null>> {
    const confirmDataResult = await this.authRepository.getConfirmationData(
      command.code,
    );
    if (confirmDataResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    if (isAfter(new Date(), confirmDataResult.payload.expirationDate))
      return new Contract(InternalCode.Expired);

    return this.authRepository.confirmEmail(confirmDataResult.payload.userId);
  }
}
