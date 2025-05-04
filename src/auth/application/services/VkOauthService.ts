import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { AppConfig } from '../../../config';
import { SuccessResult, SuccessResultType } from '../../../libs/error-handling/result';
import { UserRepository } from '../../repositories';

interface VkTokenResponse {
  access_token: string;
  expires_in: number;
  user_id: number;
  email?: string;
}

interface VkUserInfo {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
}

@Injectable()
export class VkOauthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly userRepository: UserRepository,
    @Inject(AppConfig.name) private readonly appConfig: AppConfig,
  ) {}

  async getVkUserInfo(code: string): Promise<SuccessResultType<any>> {
    try {
      // Получаем токен доступа
      const tokenResponse = await this.getAccessToken(code);
      if (tokenResponse.hasError) {
        return tokenResponse;
      }

      const { access_token, user_id } = tokenResponse.payload;

      // Получаем информацию о пользователе
      const userInfo = await this.getUserInfo(access_token, user_id);
      if (userInfo.hasError) {
        return userInfo;
      }

      return new SuccessResult(userInfo.payload);
    } catch (error) {
      console.error('VK OAuth error:', error);
      throw new InternalServerErrorException(error);
    }
  }

  private async getAccessToken(code: string): Promise<SuccessResultType<VkTokenResponse>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<VkTokenResponse>(this.appConfig.settings.oauth.VK.TOKEN_URL, {
          params: {
            client_id: this.appConfig.settings.oauth.VK.CLIENT_ID,
            client_secret: this.appConfig.settings.oauth.VK.CLIENT_SECRET,
            redirect_uri: this.appConfig.settings.oauth.VK.CLIENT_REDIRECT_URI,
            code,
          },
        }),
      );

      return new SuccessResult(data);
    } catch (error) {
      console.error('VK token error:', error);
      throw new InternalServerErrorException(error);
    }
  }

  private async getUserInfo(accessToken: string, userId: number): Promise<SuccessResultType<VkUserInfo>> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ response: VkUserInfo[] }>(`${this.appConfig.settings.oauth.VK.API_URL}/users.get`, {
          params: {
            access_token: accessToken,
            user_ids: userId,
            fields: 'photo_200',
            v: this.appConfig.settings.oauth.VK.API_VERSION,
          },
        }),
      );

      if (!data.response || data.response.length === 0) {
        return;
      }

      return new SuccessResult(data.response[0]);
    } catch (error) {
      console.error('VK user info error:', error);
      throw new InternalServerErrorException(error);
    }
  }
}
