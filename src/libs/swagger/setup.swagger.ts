import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

// const operationIdFactory = (controllerKey: string, methodKey: string) =>
//   `${methodKey}`;

export const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Auth service')
    .setDescription('Auth service API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // operationIdFactory,
  });

  SwaggerModule.setup('api/v1/swagger', app, document);
};
