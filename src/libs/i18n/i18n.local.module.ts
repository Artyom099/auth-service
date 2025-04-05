import { Global, Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';

import * as path from 'path';

import { I18nAdapter } from './i18n.adapter';

import { AppConfig } from '../../config';

@Global()
@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: (appConfig: AppConfig) => ({
        fallbackLanguage: appConfig.settings.i18n.FALLBACK_LANGUAGE,
        loaderOptions: {
          path: path.join(__dirname, appConfig.settings.i18n.I18N_PATH),
          watch: true,
        },
      }),
      resolvers: [AcceptLanguageResolver],
      inject: [AppConfig.name],
    }),
  ],
  providers: [I18nAdapter],
  exports: [I18nAdapter],
})
export class I18nLocalModule {}
