import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { google } from 'googleapis';

import {
  AuthController,
  AuthService,
  ConfirmEmailUseCase,
  ConfirmPasswordRecoveryUseCase,
  DeleteDeviceUseCase,
  DeleteOtherDevicesUseCase,
  DeviceController,
  DeviceQueryRepository,
  DeviceRepository,
  EmailConfirmationRepository,
  EmailService,
  GithubOauthUseCase,
  GoogleOauthUseCase,
  LogInUseCase,
  LogOutUseCase,
  PasswordRecoveryRepository,
  PasswordRecoveryUseCase,
  RefreshSessionUseCase,
  RegistrationUseCase,
  ResendEmailConfirmationUseCase,
  StartController,
  TokenService,
  UpdatePasswordUseCase,
  UserQueryRepository,
  UserTypeOrmRepository,
  VkOauthService,
  VkOauthUseCase,
} from './auth';
import { YandexAuthController } from './auth/api/controllers/YandexAuthController';
import { UpsertYandexUserUseCase } from './auth/application/use-cases/yandex/UpsertYandexUserUseCase';
import { AppConfig, AppConfigModule } from './config';
import { AuthServicePgDataSource, DataSourceConfig } from './libs/db';
import { entities } from './libs/db/entity';
import { EmailAdapter } from './libs/email';

const controllers = [AuthController, DeviceController, StartController, YandexAuthController];

const services = [EmailService, AuthService, TokenService, VkOauthService];

const useCases = [
  LogInUseCase,
  LogOutUseCase,
  RefreshSessionUseCase,
  RegistrationUseCase,

  GithubOauthUseCase,
  GoogleOauthUseCase,
  VkOauthUseCase,
  UpsertYandexUserUseCase,

  ConfirmEmailUseCase,
  ResendEmailConfirmationUseCase,

  UpdatePasswordUseCase,
  PasswordRecoveryUseCase,
  ConfirmPasswordRecoveryUseCase,

  DeleteDeviceUseCase,
  DeleteOtherDevicesUseCase,
];

const repositories = [
  UserTypeOrmRepository,
  UserQueryRepository,
  DeviceRepository,
  DeviceQueryRepository,
  EmailConfirmationRepository,
  PasswordRecoveryRepository,
];

const infrastructureModules = [AppConfigModule];

@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync({
      useFactory: (appConfig: AppConfig) => {
        const { SECRET, PUBLIC_KEY, PRIVATE_KEY, PASSPHRASE, ENCRYPTION_TYPE } = appConfig.settings.jwt;

        const encryptionTypes = {
          DEFAULT: { secret: SECRET },
          ASYMMETRY: {
            publicKey: PUBLIC_KEY,
            privateKey: {
              key: PRIVATE_KEY,
              passphrase: PASSPHRASE,
            },
            signOptions: { algorithm: 'RS256' },
            verifyOptions: { algorithms: ['RS256'] },
          },
        };

        return {
          global: true,
          ...encryptionTypes[ENCRYPTION_TYPE],
        };
      },
      inject: [AppConfig.name],
    }),
    ThrottlerModule.forRoot([{ ttl: 1000, limit: 10 }]),
    HttpModule.register({ timeout: 10_000 }),
    TypeOrmModule.forRoot(DataSourceConfig),
    TypeOrmModule.forFeature(entities, AuthServicePgDataSource),
    ...infrastructureModules,
  ],
  controllers,
  providers: [
    ...services,
    ...useCases,
    ...repositories,
    EmailAdapter,
    {
      provide: 'GOOGLE-AUTH',
      useFactory: (appConfig: AppConfig) => {
        const { CLIENT_ID, CLIENT_SECRET, CLIENT_REDIRECT_URI } = appConfig.settings.oauth.GOOGLE;

        return new google.auth.OAuth2({
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          redirectUri: CLIENT_REDIRECT_URI,
        });
      },
      inject: [AppConfig.name],
    },
    {
      provide: 'YANDEX-CONFIG',
      useFactory: (appConfig: AppConfig) => ({
        clientId: appConfig.settings.oauth.YANDEX.CLIENT_ID,
        clientSecret: appConfig.settings.oauth.YANDEX.CLIENT_SECRET,
        redirectUri: appConfig.settings.oauth.YANDEX.CLIENT_REDIRECT_URI,
      }),
      inject: [AppConfig.name],
    },
  ],
  exports: [UserTypeOrmRepository],
})
export class AppModule {}
