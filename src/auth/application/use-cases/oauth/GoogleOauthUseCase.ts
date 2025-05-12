import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { OAuth2Client, TokenInfo } from 'google-auth-library/build/src/auth/oauth2client';
import { EntityManager } from 'typeorm';

import { BaseOauthCommand, BaseOauthUseCase } from './BaseOauthUseCase';
import { ProviderDataType } from './utils/types';

import { AppConfig } from '../../../../config';
import { OauthServicesTypesEnum } from '../../../../libs/enums/OauthServicesTypesEnum';
import { UserRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class GoogleOauthCommand extends BaseOauthCommand {}

@CommandHandler(GoogleOauthCommand)
export class GoogleOauthUseCase extends BaseOauthUseCase<GoogleOauthCommand> {
  OAUTH_SERVICE_TYPE = OauthServicesTypesEnum.GOOGLE;

  constructor(
    protected manager: EntityManager,
    protected tokenService: TokenService,
    protected usersRepository: UserRepository,
    @Inject(AppConfig.name) protected appConfig: AppConfig,
    @Inject('GOOGLE-AUTH') protected readonly googleApi: OAuth2Client,
  ) {
    super(manager, tokenService, usersRepository);
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
