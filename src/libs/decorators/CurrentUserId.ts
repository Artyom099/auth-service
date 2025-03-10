import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayloadType } from '../../auth/api/models/dto/access.token.payload.type';

/**
 * декоратор, который достает userId из request, если ендпоинт защищен AuthGuard
 * или из токена, если ендпоинт публичный
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if (request.userId) return request.userId;

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') {
      const tokenPayload = new JwtService().decode(token);

      return (tokenPayload as AccessTokenPayloadType).userId;
    }
  },
);
