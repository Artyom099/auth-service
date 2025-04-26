import { Body, Controller, Ip, Post, Res } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CookieOptions, Response } from 'express';

import { PairTokensType } from './models/dto/pair.tokens.type';
import { VkOauthRequestDto } from './models/input/VkOauthRequestDto';

import { ResultType } from '../../libs/error-handling/result';
import { VkOauthCommand } from '../application';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
  private REFRESH_TOKEN_COOKIE_KEY = 'refreshToken';
  private ACCESS_TOKEN_COOKIE_KEY = 'accessToken';
  private cookieOptions: CookieOptions;

  constructor(private commandBus: CommandBus) {}

  /**
   * 1. Пользователь нажимает кнопку "Войти через VK" на фронтенде
   * 2. Фронтенд делает запрос на URL авторизации VK:
   * -> https://oauth.vk.com/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=email
   * 3. После авторизации VK перенаправляет пользователя отправляет фронту код авторизации
   * 4. Фронт отправляет бэку получает код авторизации на /auth/vk/callback
   * 5. Сервис обменивает код на access token
   * 6. С помощью access token получает информацию о пользователе
   * 7. Создает или обновляет пользователя в вашей базе данных
   * 8. Генерирует JWT токены и возвращает их пользователю
   */

  @Post('vk/callback')
  async vkOauthCallback(
    @Body() body: VkOauthRequestDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResultType<PairTokensType>> {
    const result = await this.commandBus.execute(new VkOauthCommand(body.code, ip));

    if (result.hasError) {
      return result;
    }

    const { accessToken, refreshToken } = result.payload;

    res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, refreshToken, this.cookieOptions);
    res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);

    return result;
  }
}
