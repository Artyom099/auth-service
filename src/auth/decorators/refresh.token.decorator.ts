import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RefreshToken = createParamDecorator(
  async (data: unknown, context: ExecutionContext): Promise<string> => {
    const request = await context.switchToHttp().getRequest();

    return request.cookies && request.cookies.refreshToken
      ? request.cookies.refreshToken
      : null;
  },
);
