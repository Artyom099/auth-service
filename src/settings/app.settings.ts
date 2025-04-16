import { DynamicModule, INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import * as cookieParser from 'cookie-parser';
import { I18nValidationPipe } from 'nestjs-i18n';

import { setupSwagger } from '../libs';
import { ResponseInterceptor } from '../libs/error-handling/response.interceptor';
import { ErrorExtensionType, ErrorResult, InternalErrorCode } from '../libs/error-handling/result';

export const appSettings = <T>(app: INestApplication, module: T) => {
  useContainer(app.select(module as DynamicModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new I18nValidationPipe(),

    new ValidationPipe({
      transform: true,
      forbidUnknownValues: false,

      exceptionFactory: (errors) => {
        const extensions: ErrorExtensionType[] = errors.map((err: ValidationError) => {
          return {
            field: err.property,
            message: Object.values(err.constraints).toString(),
          };
        });

        const error = { code: InternalErrorCode.BadRequest, extensions };
        return new ErrorResult(error);
      },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    allowedHeaders: ['content-type', 'authorization'],
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  setupSwagger(app);
};
