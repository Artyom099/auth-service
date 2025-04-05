import { ContextType, Injectable, NestInterceptor } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { CallHandler } from '@nestjs/common/interfaces/features/nest-interceptor.interface';
import { map } from 'rxjs';

import { HandlerType } from './handlers/handler.type';
import { httpHandler } from './handlers/http.handler';
import { Result, ResultType, SuccessResult } from './result';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        if (!(data instanceof Result)) {
          return new SuccessResult(data);
        }
        data = data as ResultType<unknown>;

        const type = context.getType();
        const handler = TypeHandlers[type];

        return handler(data);
      }),
    );
  }
}

const TypeHandlers: { [key in ContextType]?: HandlerType } = {
  http: httpHandler,
};
