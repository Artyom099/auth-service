import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { hash } from 'bcrypt';
import { sub } from 'date-fns';
import { UpdatePasswordInputModel } from '../../api/models/input/update.password.input.model';
import { UpdateCodeDTO } from '../../api/models/dto/update.code.dto';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';

export class UpdatePasswordCommand {
  constructor(public body: UpdatePasswordInputModel) {}
}

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordUseCase
  implements ICommandHandler<UpdatePasswordCommand>
{
  private readonly SALT_ROUND: 10;

  constructor(private authRepository: AuthRepository) {}

  async execute(command: UpdatePasswordCommand): Promise<Contract<null>> {
    const { newPassword, recoveryCode } = command.body;

    const recoveryDataResult =
      await this.authRepository.getRecoveryData(recoveryCode);
    if (recoveryDataResult.hasError())
      return new Contract(InternalCode.Internal_Server);

    const passwordHash = await hash(newPassword, this.SALT_ROUND);

    await this.authRepository.updatePassword(
      recoveryDataResult.payload.userId,
      passwordHash,
    );

    const data: UpdateCodeDTO = {
      userId: recoveryDataResult.payload.userId,
      expirationDate: sub(new Date(), { days: 1 }),
      code: recoveryDataResult.payload.recoveryCode,
    };
    await this.authRepository.upsertRecoveryData(data);

    return new Contract(InternalCode.Success);
  }
}
