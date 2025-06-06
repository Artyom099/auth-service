import { HttpService } from '@nestjs/axios';
import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { EntityManager } from 'typeorm';

import { BaseOauthCommand, BaseOauthUseCase } from './BaseOauthUseCase';
import { ProviderDataType } from './utils/types';

import { AppConfig } from '../../../../config';
import { OauthServicesTypesEnum } from '../../../../libs/enums/OauthServicesTypesEnum';
import { UserRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class GithubOauthCommand extends BaseOauthCommand {}

@CommandHandler(GithubOauthCommand)
export class GithubOauthUseCase extends BaseOauthUseCase<GithubOauthCommand> {
  OAUTH_SERVICE_TYPE = OauthServicesTypesEnum.GITHUB;

  GET_USER_URL = 'https://api.github.com/user';
  GET_EMAILS_URL = 'https://api.github.com/user/emails';
  GET_TOKENS_URL = 'https://github.com/login/oauth/access_token';

  defaultConfig = { headers: { accept: 'application/json' } };

  constructor(
    protected manager: EntityManager,
    protected httpService: HttpService,
    protected tokenService: TokenService,
    protected usersRepository: UserRepository,
    @Inject(AppConfig.name) protected appConfig: AppConfig,
  ) {
    super(manager, tokenService, usersRepository);
  }

  async getUser(code: string) {
    const payload = await this.getTokens(code);

    const githubData = await this.getUserByAccessToken(payload.access_token);
    return this.mapToProviderData(githubData);
  }

  async mapToProviderData(githubUser: GithubUserDto): Promise<ProviderDataType> {
    return {
      id: githubUser.id,
      login: githubUser.login,
      photoUrl: githubUser.avatar_url,
      email: githubUser.emails.find((email) => email.primary)!.email,
    };
  }

  protected async getTokens(code: string) {
    const { CLIENT_ID, CLIENT_SECRET } = this.appConfig.settings.oauth.GITHUB;

    const params = {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    };

    return lastValueFrom(
      this.httpService.post<TokensDto>(this.GET_TOKENS_URL, params, this.defaultConfig).pipe(map((res) => res.data)),
    );
  }

  protected async getUserByAccessToken(accessToken: string): Promise<GithubUserDto> {
    const [user, emails] = await Promise.all([
      lastValueFrom(
        this.httpService
          .get<GithubUserResponseData>(this.GET_USER_URL, {
            headers: {
              ...this.defaultConfig.headers,
              Authorization: `token ${accessToken}`,
            },
          })
          .pipe(map((res) => res.data)),
      ),

      lastValueFrom(
        this.httpService
          .get<GithubUserEmails>(this.GET_EMAILS_URL, {
            headers: {
              ...this.defaultConfig.headers,
              Authorization: `token ${accessToken}`,
            },
          })
          .pipe(map((res) => res.data)),
      ),
    ]);

    return { ...user, emails };
  }
}

type GithubUserResponseData = {
  id: number;
  login: string;
  avatar_url: string;
};

type GithubUserDto = {
  id: number;
  login: string;
  emails: GithubUserEmails;
  avatar_url: string;
};

type GithubUserEmails = Array<{ email: string; primary: boolean }>;

type TokensDto = { access_token: string; token_type: string };
