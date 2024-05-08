import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiFoundResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function DeleteDeviceEndpoint() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete device by id' }),
    ApiBearerAuth(),
    ApiNoContentResponse({
      description: 'Successfully delete device current user',
    }),
    ApiNotFoundResponse({ description: 'Current device not found' }),
    ApiFoundResponse({ description: 'This is not your device' }),
    ApiUnauthorizedResponse({ description: 'If password or login is wrong' }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
