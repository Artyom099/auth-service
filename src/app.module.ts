import { Module } from '@nestjs/common';
import { configModule } from './config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserUseCase } from './features/auth/application/user/create.user.use.case';
import { ValidateUserUseCase } from './features/auth/application/auth/validate.user.use.case';
import { RegistrationUseCase } from './features/auth/application/auth/registration.use.case';
import { LogInUseCase } from './features/auth/application/auth/log.in.use.case';
import { LogOutUseCase } from './features/auth/application/auth/log.out.use.case';
import { RefreshSessionUseCase } from './features/auth/application/auth/refresh.session.use.case';
import { UpdatePasswordUseCase } from './features/auth/application/password.recovery/update.password.use.case';
import { PasswordRecoveryUseCase } from './features/auth/application/password.recovery/password.recovery.use.case';
import { SendEmailUseCase } from './infrastructure/email/application/send.email.use.case';
import { ConfirmEmailUseCase } from './features/auth/application/email.confirmation/confirm.email.use.case';
import { ResendEmailConfirmationUseCase } from './features/auth/application/email.confirmation/resend.email.confirmation.use.case';
import { CreateDeviceUseCase } from './features/device/application/create.device.use.case';
import { UpdateSessionUseCase } from './features/device/application/update.session.use.case';
import { DeleteDeviceUseCase } from './features/device/application/delete.device.use.case';
import { AuthRepository } from './features/auth/infrastructure/auth.repository';
import { AuthQueryRepository } from './features/auth/infrastructure/auth.query.repository';
import { DeviceRepository } from './features/device/infrastructure/devices.repository';
import { ValidRecoveryCodePipe } from './infrastructure/pipes/valid.recovery.code.pipe';
import { ValidConfirmationCodePipe } from './infrastructure/pipes/valid.confirmation.code.pipe';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './features/auth/api/auth.controller';
import { LocalStrategy } from './features/auth/strategies/local.srtategy';
import { JwtAccessStrategy } from './features/auth/strategies/jwt.access.strategy';
import { JwtRefreshStrategy } from './features/auth/strategies/jwt.refresh.strategy';
import { EmailManager } from './infrastructure/email/manager/email.manager';
import { EmailAdapter } from './infrastructure/email/adapter/email.adapter';

import { GlobalConfigService } from './config/config.service';
import { AppConfigModule } from './config 2/app-config.module';

const services = [GlobalConfigService, PrismaService];

const useCases = [
  CreateUserUseCase,
  ValidateUserUseCase,

  RegistrationUseCase,
  LogInUseCase,
  LogOutUseCase,
  RefreshSessionUseCase,

  UpdatePasswordUseCase,
  PasswordRecoveryUseCase,

  SendEmailUseCase,
  ConfirmEmailUseCase,
  ResendEmailConfirmationUseCase,

  CreateDeviceUseCase,
  UpdateSessionUseCase,
  DeleteDeviceUseCase,
];

const repositories = [AuthRepository, AuthQueryRepository, DeviceRepository];

const pipes = [ValidRecoveryCodePipe, ValidConfirmationCodePipe];

const strategies = [LocalStrategy, JwtAccessStrategy, JwtRefreshStrategy];

const infrastructureModules = [AppConfigModule, configModule];

@Module({
  imports: [
    CqrsModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
    ...infrastructureModules,
  ],
  controllers: [AuthController],
  providers: [
    ...services,
    ...useCases,
    ...repositories,
    ...pipes,
    ...strategies,
    EmailAdapter,
    EmailManager,
  ],
})
export class AppModule {}
