import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { BAD_REQUEST_SCHEMA } from '../../error-handling/bad.request.schema';

export function ConfirmRegistrationApi() {
  return applyDecorators(
    ApiOperation({
      summary: 'Confirm Registration',
      description:
        'This endpoint is used to confirm email ownership and automatically redirect user to the login page.',
    }),
    ApiNoContentResponse({
      description: 'Email have verified. Account have activated',
    }),
    ApiBadRequestResponse({
      description:
        'If the confirmation code is incorrect, expired or already applied',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
