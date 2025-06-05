import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { GetUserInfoResponseDto } from '../../dto';

export function MeApi() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get information about current user' }),
    ApiOkResponse({ type: GetUserInfoResponseDto }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
