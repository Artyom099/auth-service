import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function GetDevicesApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Get active devices current user' }),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Return an array of active devices current user.',
    }),
    ApiUnauthorizedResponse({ description: 'If password or login is wrong' }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
