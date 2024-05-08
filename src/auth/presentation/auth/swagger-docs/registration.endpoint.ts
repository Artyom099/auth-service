import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { BAD_REQUEST_SCHEMA } from '../../../../infrastructure/error-handling/bad.request.schema';

export function RegistrationEndpoint() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Registration in the system. Email with confirmation code will be send to passed email address',
    }),
    ApiNoContentResponse({
      description:
        'Input data is accepted. Email with confirmation code will be send to passed email address',
    }),
    ApiBadRequestResponse({
      description:
        'If the inputModel has incorrect values (in particular if the user with the given email or login already exists)',
      schema: BAD_REQUEST_SCHEMA,
    }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
