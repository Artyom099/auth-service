import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { hash } from 'bcrypt';
import { add } from 'date-fns';
import { Prisma } from '@prisma/client';
import { Contract } from '../../../../infrastructure/contract/contract';
import { InternalCode } from '../../../../infrastructure/utils/enums';

export class CreateUserCommand {
  constructor(
    public login: string,
    public email: string,
    public password: string,
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  private readonly SALT_ROUND: 10;

  constructor(private authRepository: AuthRepository) {}

  async execute(command: CreateUserCommand): Promise<any> {
    const { login, email, password } = command;

    const passwordHash = await hash(password, this.SALT_ROUND);

    const data: Prisma.UserCreateInput = {
      login,
      email,
      passwordHash,
    };
    const expirationDate = add(new Date(), { hours: 1 });

    const userResult = await this.authRepository.createUser(
      data,
      expirationDate,
    );

    return new Contract(InternalCode.Success, userResult.payload);
  }
}
