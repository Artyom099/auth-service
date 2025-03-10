import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { BAD_REQUEST_SCHEMA } from '../../error-handling/bad.request.schema';

export function ConfirmPasswordRecoveryApi() {
  return applyDecorators(
    ApiOperation({
      summary: 'Confirm recovery password',
    }),
    ApiNoContentResponse({
      description: 'Email have verified',
    }),
    ApiBadRequestResponse({
      description: 'If the recovery code is incorrect, expired or already used',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
