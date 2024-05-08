import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { BAD_REQUEST_SCHEMA } from '../../../../infrastructure/error-handling/bad.request.schema';

export function UpdatePasswordEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary: 'New password',
      description: 'This endpoint is used to set a new password',
    }),
    ApiNoContentResponse({
      description: 'If code is valid and new password is accepted',
    }),
    ApiBadRequestResponse({
      description:
        'If the inputModel has incorrect values (recovery code is incorrect, expired or not confirmed or password incorrect)',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
