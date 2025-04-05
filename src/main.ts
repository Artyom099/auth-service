import { NestFactory } from '@nestjs/core';
import { AppModule } from './AppModule';
import { appSettings } from './settings/app.settings';
import { appConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  appSettings<AppModule>(app, AppModule);

  const port = appConfig.settings.backend.PORT;
  await app.listen(port, () => {
    console.log(`App started at http://localhost:${port}/api/v1`);
    console.log(`Swagger http://localhost:${port}/api/v1/swagger`);
  });
}
bootstrap();
