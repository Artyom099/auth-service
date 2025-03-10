import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { EmailAdapter } from './libs';
import { AppConfigModule } from './config/app-config.module';
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
  TokenService,
  UpdatePasswordUseCase,
  UserQueryRepository,
  UserRepository,
} from './auth';
import { AppConfig } from './config/app-config';
import { ThrottlerModule } from '@nestjs/throttler';
import { I18nLocalModule } from './libs';
import { HttpModule } from '@nestjs/axios';
import { google } from 'googleapis';

const services = [PrismaService, EmailService, AuthService, TokenService];

const useCases = [
  LogInUseCase,
  LogOutUseCase,
  RefreshSessionUseCase,
  RegistrationUseCase,

  GithubOauthUseCase,
  GoogleOauthUseCase,

  ConfirmEmailUseCase,
  ResendEmailConfirmationUseCase,

  UpdatePasswordUseCase,
  PasswordRecoveryUseCase,
  ConfirmPasswordRecoveryUseCase,

  DeleteDeviceUseCase,
  DeleteOtherDevicesUseCase,
];

const repositories = [
  UserRepository,
  UserQueryRepository,
  DeviceRepository,
  DeviceQueryRepository,
  EmailConfirmationRepository,
  PasswordRecoveryRepository,
];

const infrastructureModules = [AppConfigModule, I18nLocalModule];

@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync({
      useFactory: (appConfig: AppConfig) => {
        const { SECRET, PUBLIC_KEY, PRIVATE_KEY, PASSPHRASE, ENCRYPTION_TYPE } =
          appConfig.settings.jwt;

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
    HttpModule.register({ timeout: 10000 }),
    ...infrastructureModules,
  ],
  controllers: [AuthController, DeviceController],
  providers: [
    ...services,
    ...useCases,
    ...repositories,
    EmailAdapter,
    {
      provide: 'GOOGLE-AUTH',
      useFactory: (appConfig: AppConfig) => {
        const { CLIENT_ID, CLIENT_SECRET, CLIENT_REDIRECT_URI } =
          appConfig.settings.oauth.GOOGLE;

        return new google.auth.OAuth2({
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          redirectUri: CLIENT_REDIRECT_URI,
        });
      },
      inject: [AppConfig.name],
    },
  ],
  exports: [UserRepository],
})
export class AppModule {}
