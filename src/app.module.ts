import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { EmailAdapter } from './infrastructure/email/email.adapter';
import { AppConfigModule } from './config/app-config.module';
import { RegistrationUseCase } from './auth/application/use-cases/auth/registration.use.case';
import { LogInUseCase } from './auth/application/use-cases/auth/log.in.use.case';
import { LogOutUseCase } from './auth/application/use-cases/auth/log.out.use.case';
import { RefreshSessionUseCase } from './auth/application/use-cases/auth/refresh.session.use.case';
import { UpdatePasswordUseCase } from './auth/application/use-cases/password-recovery/update.password.use.case';
import { PasswordRecoveryUseCase } from './auth/application/use-cases/password-recovery/password.recovery.use.case';
import { ConfirmEmailUseCase } from './auth/application/use-cases/email-confirmation/confirm.email.use.case';
import { ResendEmailConfirmationUseCase } from './auth/application/use-cases/email-confirmation/resend.email.confirmation.use.case';
import { UserQueryRepository } from './auth/repositories/user/user.query.repository';
import { DeviceRepository } from './auth/repositories/device/device.repository';
import { AuthController } from './auth/presentation/auth/auth.controller';
import { EmailService } from './auth/application/services/email.service';
import { AuthService } from './auth/application/services/auth.service';
import { ConfirmPasswordRecoveryUseCase } from './auth/application/use-cases/password-recovery/confirm.password.recovery.use.case';
import { UserRepository } from './auth/repositories/user/user.repository';
import { TokenService } from './auth/application/services/token.service';
import { AppConfig } from './config/app-config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EmailConfirmationRepository } from './auth/repositories/email-confirmation/email.confirmation.repository';
import { PasswordRecoveryRepository } from './auth/repositories/password-recovery/password.recovery.repository';
import { I18nLocalModule } from './i18n/i18n.local.module';
import { HttpModule } from '@nestjs/axios';
import { google } from 'googleapis';
import { GithubOauthUseCase } from './auth/application/use-cases/auth/oauth/github-oauth.use-case';
import { GoogleOauthUseCase } from './auth/application/use-cases/auth/oauth/google.oauth.use-case';
import { DeviceController } from './auth/presentation/device/device.controller';
import { DeviceQueryRepository } from './auth/repositories/device/device.query.repository';
import { DeleteDeviceUseCase } from './auth/application/use-cases/device/delete.device.use.case';
import { DeleteOtherDevicesUseCase } from './auth/application/use-cases/device/delete.other.devices.use.case';

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
    ...infrastructureModules,
    ThrottlerModule.forRoot([{ ttl: 1000, limit: 10 }]),
    HttpModule.register({ timeout: 10000 }),
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
