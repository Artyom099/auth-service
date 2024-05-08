import { Request } from 'express';
import { TokenService } from '../application/services/token.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ErrorResult,
  InternalErrorCode,
} from '../../infrastructure/error-handling/result';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token)
      throw new UnauthorizedException(
        new ErrorResult({
          code: InternalErrorCode.Unauthorized,
          extensions: [],
        }),
      );

    try {
      const tokenPayload = await this.tokenService.verifyAccessToken(token);

      request.userId = tokenPayload.userId;
    } catch (e) {
      console.log({ auth_guard_err: e });
      throw new UnauthorizedException(
        new ErrorResult({
          code: InternalErrorCode.Unauthorized,
          extensions: [],
        }),
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
