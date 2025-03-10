import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function DeleteOtherDevicesApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete other devices current user' }),
    ApiBearerAuth(),
    ApiHeader({
      name: 'Cookie',
      required: true,
      description: 'Refresh token',
      schema: {
        example: 'refreshToken=FkIjp7InVzZXJJZCI6OH0sImlhdCI6MTcxMjQyOD',
      },
    }),
    ApiNoContentResponse({
      description: 'Successfully delete other devices current user',
    }),
    ApiUnauthorizedResponse({ description: 'If password or login is wrong' }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
