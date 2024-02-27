import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { Contract } from '../../../../infrastructure/contract/contract';

export class DeleteUserCommand {
  constructor(public userId: number) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private authRepository: AuthRepository) {}

  async execute(command: DeleteUserCommand): Promise<Contract<null>> {
    return this.authRepository.deleteUser(command.userId);
  }
}
