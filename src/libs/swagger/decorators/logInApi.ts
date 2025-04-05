import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { BAD_REQUEST_SCHEMA } from '../../error-handling/bad.request.schema';

export function LogInApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Log in user to the system' }),
    ApiOkResponse({
      description:
        'Return accessToken (expired after 15 minutes) and refreshToken in cookie (expired after 24 hours) (http-only, secure).',
    }),
    ApiBadRequestResponse({
      description: 'If the inputModel has incorrect values',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiUnauthorizedResponse({ description: 'If password or login is wrong' }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
