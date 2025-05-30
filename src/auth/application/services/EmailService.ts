import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

import { AppConfig } from '../../../config';
import { EmailAdapter } from '../../../libs/email';
import { ResultType, SuccessResult } from '../../../libs/error-handling/result';

@Injectable()
export class EmailService {
  constructor(
    private emailAdapter: EmailAdapter,
    @Inject(AppConfig.name)
    private appConfig: AppConfig,
  ) {}

  async sendEmailConfirmationMessage(email: string, confirmationCode: string): Promise<ResultType<null>> {
    const domain = 'link';

    const message = `
      <h1>Thanks for your registration</h1>
      <p>Your code: ${confirmationCode}. To finish registration please follow the link below:
      <a href="${domain}?code=${confirmationCode}">complete registration</a>
      </p>
    `;

    const subject = 'Registration confirmation';

    const isSending = await this.emailAdapter.sendEmail(email, subject, message);

    if (!isSending) {
      throw new InternalServerErrorException(`${subject} email is not sent`);
    }

    return new SuccessResult(null);
  }

  async sendPasswordRecoveryMessage(email: string, recoveryCode: string): Promise<ResultType<null>> {
    const domain = 'link';

    const message = `
      <h1>Password recovery</h1>
      <p>Code for finish update: ${recoveryCode}. To finish password recovery please follow the link below:\n
      <a href="${domain}auth/confirm-password-recovery?code=${recoveryCode}">recovery password</a>\n
      </p>
    `;

    const subject = 'Password recovery';

    const isSending = await this.emailAdapter.sendEmail(email, subject, message);

    if (!isSending) {
      throw new InternalServerErrorException(`${subject} email is not sent`);
    }

    return new SuccessResult(null);
  }
}
