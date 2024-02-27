import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailManager } from '../manager/email.manager';
import { Contract } from '../../contract/contract';
import { EmailEvent, InternalCode } from '../../utils/enums';

export class SendEmailCommand {
  constructor(
    public event: EmailEvent,
    public email: string,
    public code: string,
  ) {}
}

@CommandHandler(SendEmailCommand)
export class SendEmailUseCase implements ICommandHandler<SendEmailCommand> {
  constructor(private emailManager: EmailManager) {}

  async execute(command: SendEmailCommand): Promise<Contract<null>> {
    const { event, email, code } = command;
    let sendResult: Contract<null>;

    switch (event) {
      case EmailEvent.EmailConfirmation:
        sendResult = await this.emailManager.sendEmailConfirmationMessage(
          email,
          code,
        );
        break;

      case EmailEvent.PasswordRecovery:
        sendResult = await this.emailManager.sendPasswordRecoveryMessage(
          email,
          code,
        );
        break;

      default:
        sendResult = new Contract(InternalCode.Internal_Server);
        break;
    }

    return new Contract(InternalCode.Success);
  }
}
