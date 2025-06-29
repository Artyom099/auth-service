import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { google } from 'googleapis';

import {
  AccessObjectQueryRepository,
  AdminController,
  AuthController,
  AuthService,
  ConfirmEmailUseCase,
  ConfirmPasswordRecoveryUseCase,
  CreateRoleUseCase,
  CreateSeedingUseCase,
  CreateUserRoleUseCase,
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
  ReassignRightsUseCase,
  RefreshSessionUseCase,
  RegistrationUseCase,
  ResendEmailConfirmationUseCase,
  RoleQueryRepository,
  SystemController,
  TokenService,
  UpdatePasswordUseCase,
  UpsertYandexUserUseCase,
  UserQueryRepository,
  UserRepository,
  YandexOauthController,
} from './auth';
import { AppConfig, AppConfigModule } from './config';
import { AuthServicePgDataSource, DataSourceConfig } from './libs/db';
import { entities } from './libs/db/entities';
import { EmailAdapter } from './libs/email';

const controllers = [AuthController, DeviceController, SystemController, YandexOauthController, AdminController];

const services = [EmailService, AuthService, TokenService];

const useCases = [
  LogInUseCase,
  LogOutUseCase,
  RefreshSessionUseCase,
  RegistrationUseCase,

  GithubOauthUseCase,
  GoogleOauthUseCase,
  UpsertYandexUserUseCase,

  ConfirmEmailUseCase,
  ResendEmailConfirmationUseCase,

  UpdatePasswordUseCase,
  PasswordRecoveryUseCase,
  ConfirmPasswordRecoveryUseCase,

  DeleteDeviceUseCase,
  DeleteOtherDevicesUseCase,

  ReassignRightsUseCase,
  CreateRoleUseCase,
  CreateSeedingUseCase,
  CreateUserRoleUseCase,
];

const repositories = [
  UserRepository,
  UserQueryRepository,
  DeviceRepository,
  DeviceQueryRepository,
  EmailConfirmationRepository,
  PasswordRecoveryRepository,
  RoleQueryRepository,
  AccessObjectQueryRepository,
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
  exports: [UserRepository],
})
export class AppModule {}
