import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSettings } from './infrastructure/settings/app.settings';
import { GlobalConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  appSettings<AppModule>(app, AppModule);

  const configService = app.get(GlobalConfigService);
  const serviceData = configService.getConnectionData('users');

  await app.listen(serviceData.port, () => {
    console.log(`App started at http://localhost:${serviceData.port}/api/v1`);
    console.log(`Swagger http://localhost:${serviceData.port}/api/v1/swagger`);
  });
}
bootstrap();
