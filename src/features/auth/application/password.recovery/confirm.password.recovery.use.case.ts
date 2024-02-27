import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { isAfter } from 'date-fns';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';

export class ConfirmPasswordRecoveryCommand {
  constructor(public code: string) {}
}

@CommandHandler(ConfirmPasswordRecoveryCommand)
export class ConfirmPasswordRecoveryUseCase
  implements ICommandHandler<ConfirmPasswordRecoveryCommand>
{
  constructor(private authRepository: AuthRepository) {}

  async execute(
    command: ConfirmPasswordRecoveryCommand,
  ): Promise<Contract<{ code: string }>> {
    const { code } = command;

    const recoveryDataResult = await this.authRepository.getRecoveryData(code);
    if (recoveryDataResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    if (isAfter(new Date(), recoveryDataResult.payload.expirationDate))
      return new Contract(InternalCode.Expired, { code });

    return this.authRepository.confirmRecoveryPassword(
      recoveryDataResult.payload.userId,
    );
  }
}
