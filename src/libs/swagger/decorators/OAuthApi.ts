import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { OauthServicesTypesEnum } from '../../enums/OauthServicesTypesEnum';
import { BAD_REQUEST_SCHEMA } from '../../error-handling/bad.request.schema';

export function OAuthApi() {
  return applyDecorators(
    ApiOperation({ summary: 'Sign in user to the system' }),
    ApiParam({ name: 'type', enum: OauthServicesTypesEnum }),
    ApiOkResponse({
      description:
        'Return accessToken (expired after 15 minutes) and refreshToken in cookie (expired after 24 hours) (http-only, secure).',
    }),
    ApiBadRequestResponse({
      description: 'If the inputModel has incorrect values',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
