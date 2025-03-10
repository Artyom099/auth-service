import {
  BaseOauthCommand,
  BaseOauthUseCase,
  ProviderDataType,
} from './BaseOauthUseCase';
import { CommandHandler } from '@nestjs/cqrs';
import { OauthServicesTypesEnum } from '../../../enums/oauth.services.types.enum';
import { HttpService } from '@nestjs/axios';
import { AppConfig } from '../../../../config/app-config';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserRepository } from '../../../repositories/user/UserRepository';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { I18nAdapter } from '../../../../libs/i18n/i18n.adapter';
import { Inject } from '@nestjs/common';
import { TokenService } from '../../services/token.service';

export class GithubOauthCommand extends BaseOauthCommand {}

@CommandHandler(GithubOauthCommand)
export class GithubOauthUseCase extends BaseOauthUseCase<GithubOauthCommand> {
  OAUTH_SERVICE_TYPE = OauthServicesTypesEnum.GITHUB;

  GET_USER_URL = 'https://api.github.com/user';
  GET_EMAILS_URL = 'https://api.github.com/user/emails';
  GET_TOKENS_URL = 'https://github.com/login/oauth/access_token';

  defaultConfig = { headers: { accept: 'application/json' } };

  constructor(
    protected prisma: PrismaService,
    protected i18nAdapter: I18nAdapter,
    protected httpService: HttpService,
    protected tokenService: TokenService,
    protected usersRepository: UserRepository,
    @Inject(AppConfig.name) protected appConfig: AppConfig,
  ) {
    super(prisma, i18nAdapter, tokenService, usersRepository);
  }

  async getUser(code: string) {
    const payload = await this.getTokens(code);

    const githubData = await this.getUserByAccessToken(payload.access_token);
    return this.mapToProviderData(githubData);
  }

  async mapToProviderData(
    githubUser: GithubUserDto,
  ): Promise<ProviderDataType> {
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
      this.httpService
        .post<TokensDto>(this.GET_TOKENS_URL, params, this.defaultConfig)
        .pipe(map((res) => res.data)),
    );
  }

  protected async getUserByAccessToken(
    accessToken: string,
  ): Promise<GithubUserDto> {
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
