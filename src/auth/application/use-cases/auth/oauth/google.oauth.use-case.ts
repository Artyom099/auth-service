import {
  BaseOauthCommand,
  BaseOauthUseCase,
  ProviderDataType,
} from './base-oauth.use-case';
import { CommandHandler } from '@nestjs/cqrs';
import { OauthServicesTypesEnum } from '../../../../enums/oauth.services.types.enum';
import { Inject } from '@nestjs/common';
import {
  OAuth2Client,
  TokenInfo,
} from 'google-auth-library/build/src/auth/oauth2client';
import { AppConfig } from '../../../../../config/app-config';
import { UserRepository } from '../../../../repositories/user/user.repository';
import { PrismaService } from '../../../../../../prisma/prisma.service';
import { I18nAdapter } from '../../../../../i18n/i18n.adapter';
import { TokenService } from '../../../services/token.service';

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
