import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { compare } from 'bcrypt';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';

export class ValidateUserCommand {
  constructor(
    public email: string,
    public password: string,
    public originalPasswordHash?: string,
  ) {}
}

@CommandHandler(ValidateUserCommand)
export class ValidateUserUseCase
  implements ICommandHandler<ValidateUserCommand>
{
  constructor(private authRepository: AuthRepository) {}

  async execute(command: ValidateUserCommand): Promise<Contract<null>> {
    const { email, password, originalPasswordHash } = command;
    let passwordHash;

    if (!originalPasswordHash) {
      const userResult = await this.authRepository.getUserByCredentials(email);
      if (userResult.hasError()) return userResult as Contract<null>;

      passwordHash = userResult.payload.passwordHash;
    } else {
      passwordHash = originalPasswordHash;
    }

    const isUserValid = await compare(password, passwordHash);

    if (!isUserValid) return new Contract(InternalCode.Unauthorized);

    return new Contract(InternalCode.Success);
  }
}
