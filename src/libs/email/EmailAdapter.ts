import { Inject, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { AppConfig } from '../../config';

@Injectable()
export class EmailAdapter {
  constructor(@Inject(AppConfig.name) private appConfig: AppConfig) {}

  async sendEmail(email: string, subject: string, message: string): Promise<boolean> {
    const { EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD } = this.appConfig.settings.email;

    // console.log({
    //   host: EMAIL_HOST,
    //   auth: {
    //     user: EMAIL_USER,
    //     pass: EMAIL_PASSWORD,
    //   },
    // });

    const transport = nodemailer.createTransport(
      {
        host: EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      },
      {
        from: EMAIL_USER,
      },
    );

    return new Promise((resolve, reject) => {
      transport.sendMail(
        {
          from: EMAIL_USER,
          to: email,
          subject: subject,
          html: message,
        },

        (err) => {
          if (err) {
            console.error({ send_email_error: err });
            reject(err);
          } else {
            resolve(true);
          }
        },
      );
    });
  }
}
