import { Injectable } from '@nestjs/common';
import { EmailAdapter } from '../adapter/email.adapter';
import { Contract } from '../../contract/contract';
import { InternalCode } from '../../utils/enums';
import { GlobalConfigService } from '../../../config/config.service';

@Injectable()
export class EmailManager {
  constructor(
    private emailAdapter: EmailAdapter,
    private configService: GlobalConfigService,
  ) {}

  async sendEmailConfirmationMessage(
    email: string,
    confirmationCode: string,
  ): Promise<Contract<null>> {
    const domain = this.configService.getDomain();

    const message = `
      <h1>Thanks for your registration</h1>
      <p>To finish registration please follow the link below:
      <a href="${domain}auth/registration-confirmation?code=${confirmationCode}">complete registration</a>
      </p>
    `;

    const subject = 'Registration confirmation';

    const isSending = await this.emailAdapter.sendEmail(
      email,
      subject,
      message,
    );

    if (!isSending) return new Contract(InternalCode.Internal_Server);

    return new Contract(InternalCode.Success);
  }

  async sendPasswordRecoveryMessage(
    email: string,
    recoveryCode: string,
  ): Promise<Contract<null>> {
    const domain = this.configService.getDomain();

    const message = `
      <h1>Password recovery</h1>
      <p>To finish password recovery please follow the link below:\n
      <a href="${domain}auth/confirm-password-recovery?code=${recoveryCode}">recovery password</a>\n
      </p>
    `;

    const subject = 'Password recovery';

    const isSending = await this.emailAdapter.sendEmail(
      email,
      subject,
      message,
    );

    if (!isSending) return new Contract(InternalCode.Internal_Server);

    return new Contract(InternalCode.Success);
  }
}
