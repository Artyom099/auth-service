import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { AuthGuard } from './AuthGuard';
import { AuthService } from './AuthService';

import { TokenService } from '../application';

/**
 * RolesGuard проверяет, доступна ли пользователю конкретная апи или нет
 * todo - протестировать гард
 */
@Injectable()
export class RolesGuard extends AuthGuard {
  private readonly authService: AuthService;

  constructor(
    private readonly manager: EntityManager,
    tokenService: TokenService,
  ) {
    super(tokenService);
    this.authService = new AuthService(this.manager);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isUserAuthenticated = await super.canActivate(context);

    if (!isUserAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();

    const apiName = request.url.replace('/api', '');
    console.log({ request_url: request.url });
    console.log({ apiName });

    const userRoles = await this.authService.getUserRoles(request.userId);

    /**
     * ищем права пользователя к текущей апи или объекту досутпа
     */
    const isAccessGranted = await this.authService.isAccessGranted(userRoles, apiName);
    if (!isAccessGranted) {
      throw new ForbiddenException('User has no access to this object');
    }

    return true;
  }
}
