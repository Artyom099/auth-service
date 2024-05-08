import {
  ArgumentsHost,
  DynamicModule,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { setupSwagger } from '../infrastructure/swagger/setup.swagger';
import {
  I18nValidationException,
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';
import { ResponseInterceptor } from '../infrastructure/error-handling/response.interceptor';
import {
  ErrorExtensionType,
  ErrorResult,
  InternalErrorCode,
} from '../infrastructure/error-handling/result';

export const appSettings = <T>(app: INestApplication, module: T) => {
  useContainer(app.select(module as DynamicModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new I18nValidationPipe(),

    new ValidationPipe({
      transform: true,
      forbidUnknownValues: false,
      exceptionFactory: (errors) => {
        const extensions: ErrorExtensionType[] = errors.map(
          (err: ValidationError) => {
            return {
              field: err.property,
              message: Object.values(err.constraints).toString(),
            };
          },
        );

        const error = { code: InternalErrorCode.BadRequest, extensions };
        return new ErrorResult(error);
      },
    }),
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      responseBodyFormatter(
        host: ArgumentsHost,
        exception: I18nValidationException,
      ): Record<string, any> {
        console.log({ errors: exception.errors });

        const extensions: ErrorExtensionType[] = exception.errors.map(
          (err: ValidationError) => {
            return {
              field: err.property,
              message: Object.values(err.constraints).toString(),
            };
          },
        );

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
