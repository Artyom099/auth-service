import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { OAuth2Client, TokenInfo } from 'google-auth-library/build/src/auth/oauth2client';

import { BaseOauthCommand, BaseOauthUseCase, ProviderDataType } from './BaseOauthUseCase';

import { PrismaService } from '../../../../../prisma/prisma.service';
import { AppConfig } from '../../../../config';
import { I18nAdapter } from '../../../../libs';
import { OauthServicesTypesEnum } from '../../../enums/oauth.services.types.enum';
import { UserRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class GoogleOauthCommand extends BaseOauthCommand {}

@CommandHandler(GoogleOauthCommand)
export class GoogleOauthUseCase extends BaseOauthUseCase<GoogleOauthCommand> {
  OAUTH_SERVICE_TYPE = OauthServicesTypesEnum.GOOGLE;

  constructor(
    protected prisma: PrismaService,
    protected i18nAdapter: I18nAdapter,
    protected tokenService: TokenService,
    protected usersRepository: UserRepository,
    @Inject(AppConfig.name) protected appConfig: AppConfig,
    @Inject('GOOGLE-AUTH') protected readonly googleApi: OAuth2Client,
  ) {
    super(prisma, i18nAdapter, tokenService, usersRepository);
  }

  async getUser(code: string) {
    const {
      tokens: { access_token },
    } = await this.googleApi.getToken(code);

    const user = await this.googleApi.getTokenInfo(access_token);
    return this.mapToProviderData(user);
  }

  async mapToProviderData(googleUser: TokenInfo): Promise<ProviderDataType> {
    const username = googleUser.email.split('@')[0];
    return {
      id: googleUser.sub,
      email: googleUser.email,
      login: username,
    };
  }
}
