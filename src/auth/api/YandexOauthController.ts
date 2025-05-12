import { Controller, Get, HttpCode, HttpStatus, Inject, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { CookieOptions, Request, Response } from 'express';

import * as querystring from 'querystring';

import { AppConfig } from '../../config';
import { TYandexCallbackResponseDto } from '../../libs/dto';
import { UpsertYandexUserCommand } from '../application/use-cases/yandex/UpsertYandexUserUseCase';

@ApiTags('Auth')
@Controller('yandex')
export class YandexOauthController {
  private REFRESH_TOKEN_COOKIE_KEY = 'refreshToken';
  private ACCESS_TOKEN_COOKIE_KEY = 'accessToken';
  private readonly cookieOptions: CookieOptions;

  constructor(
    @Inject(AppConfig.name)
    private readonly appConfig: AppConfig,
    private readonly commandBus: CommandBus,
  ) {
    this.cookieOptions = {
      httpOnly: false,
      sameSite: !appConfig.env.isDevelopment() ? ('none' as const) : false,
      secure: !appConfig.env.isDevelopment(),
    };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Yandex OAuth callback' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully authenticated' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Authentication failed' })
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<TYandexCallbackResponseDto> {
    const startTime = new Date();

    if (!code) {
      throw new UnauthorizedException('Authorization code not provided in request');
    }

    try {
      // 1. Обмениваем код на access_token
      const params = {
        grant_type: 'authorization_code',
        code,
        client_id: this.appConfig.settings.oauth.YANDEX.CLIENT_ID,
        client_secret: this.appConfig.settings.oauth.YANDEX.CLIENT_SECRET,
        redirect_uri: this.appConfig.settings.oauth.YANDEX.CLIENT_REDIRECT_URI,
      };

      const tokenResponse = await axios.post('https://oauth.yandex.ru/token', querystring.stringify(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = tokenResponse.data;

      // 2. Получаем информацию о пользователе
      const userInfoResponse = await axios.get('https://login.yandex.ru/info', {
        headers: {
          Authorization: `OAuth ${access_token}`,
        },
      });

      console.log('User info response status:', userInfoResponse.status);
      console.log('User info response data:', userInfoResponse.data);

      const yandexUser = userInfoResponse.data;

      // 3. Получаем IP пользователя
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || 'Unknown';

      // 4. Получаем информацию об устройстве
      const deviceName = req.headers['user-agent'] || 'Unknown';

      // 5. Создаем/находим пользователя и генерируем токены
      const result = await this.commandBus.execute(
        new UpsertYandexUserCommand(
          yandexUser.id.toString(),
          yandexUser.default_email,
          yandexUser.login,
          'yandex',
          deviceName,
          ipAddress,
        ),
      );

      const { userId, accessToken, refreshToken } = result;

      // 6. Устанавливаем токены в cookie
      res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);
      res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, refreshToken, this.cookieOptions);
      res.redirect('http://localhost:5173/yandex-callback');

      const endTime = new Date();
      console.log(
        `[${endTime.toISOString()}] Yandex OAuth process completed in ${endTime.getTime() - startTime.getTime()}ms`,
      );

      return {
        userId,
        accessToken,
        refreshToken,
      };
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Yandex authentication error:`, {
        error: e.response?.data || e.message,
        stack: e.stack,
        config: e.config
          ? {
              url: e.config.url,
              method: e.config.method,
              headers: e.config.headers,
            }
          : undefined,
      });
      throw new UnauthorizedException(`Authentication failed: ${e.response?.data?.error_description || e.message}`);
    }
  }
}
