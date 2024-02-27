import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { GlobalConfigService } from '../../../config/config.service';

@Injectable()
export class EmailAdapter {
  constructor(private configService: GlobalConfigService) {}

  async sendEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<boolean> {
    const { gmail, password } = this.configService.getEmailCredentials();

    const transport = nodemailer.createTransport({
      port: 465,
      host: 'smtp.gmail.com',
      auth: {
        user: gmail,
        pass: password,
      },
    });

    return new Promise((resolve, reject) => {
      transport.sendMail(
        {
          from: `Auth-service <${gmail}>`,
          to: email,
          subject: subject,
          html: message,
        },

        (err, info) => {
          if (err) {
            console.error({ send_email_error: err });
            reject(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }
}
