import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { BAD_REQUEST_SCHEMA } from '../../error-handling/bad.request.schema';

export function RefreshTokenApi() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generate new pair of access and refresh tokens',
      description:
        'in cookie client must send correct refreshToken that will be revoked after refreshing',
    }),
    ApiHeader({
      name: 'Cookie',
      required: true,
      schema: {
        example: 'refreshToken=FkIjp7InVzZXJJZCI6OH0sImlhdCI6MTcxMjQyOD',
      },
    }),
    ApiOkResponse({
      description:
        'Returns new pair: accessToken (expired after 15 minutes) and refreshToken in cookie (http-only, secure) (expired after 24 hours).',
    }),
    ApiBadRequestResponse({
      description: 'If the refreshToken has incorrect or expired',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
