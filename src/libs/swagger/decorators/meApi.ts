import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserViewModel } from '../../../auth/api/models/view/user.view.model';

export function MeApi() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get information about current user' }),
    ApiOkResponse({ type: UserViewModel }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiTooManyRequestsResponse({
      description: 'More than 5 attempts from one IP-address during 10 seconds',
    }),
  );
}
