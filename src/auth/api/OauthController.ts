import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CookieOptions } from 'express';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
  private readonly REFRESH_TOKEN_COOKIE_KEY = 'refreshToken';
  private readonly ACCESS_TOKEN_COOKIE_KEY = 'accessToken';
  private readonly cookieOptions: CookieOptions;

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

  /**
   * @todo - если будут добавляться разные провадеры, то удобно будет держать из апи в одном контроллере,
   *  чтобы потом сделать универсальную апи oauth аутентификации
   */
}
