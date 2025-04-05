import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { HandlerType } from './handler.type';

import { InternalErrorCode, ResultType, SuccessResult } from '../result';

export const httpHandler: HandlerType = <T>(result: ResultType<T>) => {
  if (result.hasError) {
    const ExceptionClass = MapResultErrorsToHttpExceptions[result.error.code];

    throw new ExceptionClass(result);
  }
  result = result as SuccessResult<T>;

  return result;
};

const MapResultErrorsToHttpExceptions = {
  [InternalErrorCode.NotFound]: NotFoundException,
  [InternalErrorCode.Forbidden]: ForbiddenException,
  [InternalErrorCode.Expired]: BadRequestException,
  [InternalErrorCode.BadRequest]: BadRequestException,
  [InternalErrorCode.Unauthorized]: UnauthorizedException,
  [InternalErrorCode.Internal_Server]: InternalServerErrorException,
};
