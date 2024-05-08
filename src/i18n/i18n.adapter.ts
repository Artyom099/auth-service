import { I18nContext, I18nService } from 'nestjs-i18n';
import { Injectable } from '@nestjs/common';

@Injectable()
export class I18nAdapter {
  constructor(private readonly i18n: I18nService) {}

  async getMessage(message: string): Promise<string> {
    return this.i18n.t(`error.message.${message}`, { lang: this.getLang() });
  }

  getLang(): string {
    return I18nContext.current().lang;
  }
}
