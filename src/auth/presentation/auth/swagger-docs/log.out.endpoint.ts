import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { BAD_REQUEST_SCHEMA } from '../../../../infrastructure/error-handling/bad.request.schema';

export function LogOutEndpoint() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Log out user from the system',
      description:
        'In Authorisation header client must send accessToken, in cookie client must send correct refreshToken that will be expired after log out',
    }),
    ApiHeader({
      name: 'Cookie',
      required: true,
      description: 'Refresh token',
      schema: {
        example: 'refreshToken=FkIjp7InVzZXJJZCI6OH0sImlhdCI6MTcxMjQyOD',
      },
    }),
    ApiNoContentResponse({ description: 'No Content' }),
    ApiBadRequestResponse({
      description:
        'If refreshToken inside cookie is missing, expired or incorrect',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
