import {
  BadRequestException,
  DynamicModule,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';
import { setupSwagger } from '../swagger/setup.swagger';
import {
  ErrorExceptionFilter,
  HttpExceptionFilter,
} from '../filters/exception.filter';

export const appSettings = <T>(app: INestApplication, module: T) => {
  useContainer(app.select(module as DynamicModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: false,
      exceptionFactory: (errors) => {
        const customErrors = errors.map((err: ValidationError) => {
          return {
            field: err.property,
            messages: Object.values(err.constraints),
          };
        });
        throw new BadRequestException(customErrors);
      },
    }),
  );

  app.useGlobalFilters(new ErrorExceptionFilter(), new HttpExceptionFilter());
  app.enableCors({
    allowedHeaders: ['content-type', 'authorization'],
    origin: ['http://localhost:3000', 'http://localhost:3003'],
    credentials: true,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  setupSwagger(app);
};
