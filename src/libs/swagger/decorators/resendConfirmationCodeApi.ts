import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNoContentResponse, ApiOperation, ApiTooManyRequestsResponse } from '@nestjs/swagger';

import { BAD_REQUEST_SCHEMA } from '../../error-handling/bad.request.schema';

export function ResendConfirmationCodeApi() {
  return applyDecorators(
    ApiOperation({
      summary: 'Resend code for confirmation Email if user exists',
    }),
    ApiNoContentResponse({
      description: 'Input data is accepted. Email with confirmation code will be send by email',
    }),
    ApiBadRequestResponse({
      description: 'If the confirmation code is incorrect, expired or already been applied',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
