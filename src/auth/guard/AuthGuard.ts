import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { TokenService } from '../application';

/**
 * AuthGuard использующий Bearer токен для авторизации
 * написан с использованием интерфеса CanActivate для прозрачности процесса аутентификации
 */

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      const tokenPayload = await this.tokenService.verifyAccessToken(token);

      request.userId = tokenPayload.userId;
    } catch (e) {
      console.log({ auth_guard_err: e });
      throw new UnauthorizedException(`Auth guard error: ${e}`);
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
