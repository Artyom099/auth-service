import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Query,
  Res,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { RegistrationInputModel } from './models/input/registration.input.model';
import { PasswordRecoveryInputModel } from './models/input/password.recovery.input.model';
import { LogInInputModel } from './models/input/log.in.input.model';
import { UserViewModel } from './models/view/user.view.model';
import { UpdatePasswordInputModel } from './models/input/update.password.input.model';
import { AuthQueryRepository } from '../infrastructure/auth.query.repository';
import { RegistrationCommand } from '../application/auth/registration.use.case';
import { LogOutCommand } from '../application/auth/log.out.use.case';
import { UpdatePasswordCommand } from '../application/password.recovery/update.password.use.case';
import { CookieOptions } from 'express';
import { LogInCommand } from '../application/auth/log.in.use.case';
import { LogInDTO } from './models/dto/log.in.dto';
import { ResendEmailConfirmationCommand } from '../application/email.confirmation/resend.email.confirmation.use.case';
import { PasswordRecoveryCommand } from '../application/password.recovery/password.recovery.use.case';
import { RefreshSessionCommand } from '../application/auth/refresh.session.use.case';
import { ConfirmPasswordRecoveryCommand } from '../application/password.recovery/confirm.password.recovery.use.case';
import { ConfirmEmailCommand } from '../application/email.confirmation/confirm.email.use.case';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ExceptionResponseHandler } from '../../../infrastructure/contract/exception.response.handler';
import {
  ApproachType,
  InternalCode,
} from '../../../infrastructure/utils/enums';
import { ValidConfirmationCodePipe } from '../../../infrastructure/pipes/valid.confirmation.code.pipe';
import { ValidRecoveryCodePipe } from '../../../infrastructure/pipes/valid.recovery.code.pipe';
import { CurrentUserId } from '../../../infrastructure/decorators/current.user.id.decorator';
import { RefreshTokenPayload } from '../../../infrastructure/decorators/refresh.token.decorator';
import { RefreshToken } from '../../../infrastructure/utils/types';
import { JwtRefreshAuthGuard } from '../guards/jwt.refresh.auth.guard';
import { JwtAccessAuthGuard } from '../guards/jwt.access.auth.guard';
import { LocalAuthGuard } from '../guards/local.auth.guard';
import { GlobalConfigService } from '../../../config/config.service';
import { BAD_REQUEST_SCHEMA } from '../../../infrastructure/utils/bad.request.schema';

@ApiTags('Auth')
@Controller('auth')
@Controller()
export class AuthController extends ExceptionResponseHandler {
  constructor(
    private commandBus: CommandBus,
    private configService: GlobalConfigService,
    private authQueryRepository: AuthQueryRepository,
  ) {
    super(ApproachType.http);
  }

  @ApiOperation({
    summary:
      'Registration in the system. Email with confirmation code will be send to passed email address',
  })
  @ApiNoContentResponse({
    description:
      'Input data is accepted. Email with confirmation code will be send to passed email address',
  })
  @ApiBadRequestResponse({
    description:
      'If the inputModel has incorrect values (in particular if the user with the given email or login already exists)',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: RegistrationInputModel): Promise<void> {
    const registrationResult = await this.commandBus.execute(
      new RegistrationCommand(body),
    );

    return this.sendExceptionOrResponse(registrationResult);
  }

  @ApiOperation({
    summary: 'Confirm Registration',
    description:
      'This endpoint is used to confirm email ownership and automatically redirect user to the login page.',
  })
  @ApiQuery({
    name: 'code',
    description: 'Code that be sent via Email inside link',
  })
  @ApiNoContentResponse({
    description: 'Email have verified. Account have activated',
  })
  @ApiBadRequestResponse({
    description:
      'If the confirmation code is incorrect, expired or already applied',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Get('registration-confirmation')
  async confirmRegistration(
    @Query('code', ValidConfirmationCodePipe) code: string,
    @Res() res: Response,
  ): Promise<void> {
    const confirmResult = await this.commandBus.execute(
      new ConfirmEmailCommand(code),
    );

    if (
      confirmResult.code !== InternalCode.Expired &&
      confirmResult.code !== InternalCode.Success
    ) {
      return this.sendExceptionOrResponse(confirmResult);
    }

    const frontDomain = this.configService.getFrontDomain();

    const status = confirmResult.hasError() ? 'failed' : 'success';
    const redirectUrl = new URL(
      `${frontDomain}/auth/registration-confirmation/${status}`,
    );

    return res.redirect(redirectUrl.toString());
  }

  @ApiOperation({
    summary: 'Resend code for confirmation Email if user exists',
  })
  @ApiQuery({
    name: 'code',
    description: 'Code that will be send by email inside the link',
  })
  @ApiNoContentResponse({
    description:
      'Input data is accepted. Email with confirmation code will be send by email',
  })
  @ApiBadRequestResponse({
    description:
      'If the confirmation code is incorrect, expired or already been applied',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Post('resend-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendCode(
    @Query('code', ValidConfirmationCodePipe) code: string,
  ): Promise<void> {
    const sendingResult = await this.commandBus.execute(
      new ResendEmailConfirmationCommand(code),
    );

    return this.sendExceptionOrResponse(sendingResult);
  }

  @ApiOperation({
    summary:
      'Password recovery endpoint. Email should be sent with recovery code inside',
  })
  @ApiNoContentResponse({
    description:
      "Even if current email is not registered (for prevent user's email detection)",
  })
  @ApiBadRequestResponse({
    description:
      'If the inputModel has invalid email (for example sth@gmail.com)',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(
    @Body() body: PasswordRecoveryInputModel,
  ): Promise<void> {
    const passwordRecoveryResult = await this.commandBus.execute(
      new PasswordRecoveryCommand(body.email),
    );

    return this.sendExceptionOrResponse(passwordRecoveryResult);
  }

  @ApiOperation({
    summary: 'Confirm recovery password',
  })
  @ApiQuery({
    name: 'code',
    description: 'Recovery code that be sent via Email inside link',
  })
  @ApiNoContentResponse({
    description: 'Email have verified',
  })
  @ApiBadRequestResponse({
    description: 'If the recovery code is incorrect, expired or already used',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Get('confirm-password-recovery')
  async confirmPasswordRecovery(
    @Query('code', ValidRecoveryCodePipe) code: string,
    @Res() res: Response,
  ): Promise<void> {
    const confirmPasswordRecoveryResult = await this.commandBus.execute(
      new ConfirmPasswordRecoveryCommand(code),
    );

    if (
      confirmPasswordRecoveryResult.code !== InternalCode.Expired &&
      confirmPasswordRecoveryResult.code !== InternalCode.Success
    ) {
      return this.sendExceptionOrResponse(confirmPasswordRecoveryResult);
    }

    const frontDomain = this.configService.getFrontDomain();

    const status = confirmPasswordRecoveryResult.hasError()
      ? 'failed'
      : 'success';

    const redirectUrl = new URL(
      `${frontDomain}/auth/create-new-password/${status}?code=${confirmPasswordRecoveryResult.payload.code}`,
    );

    return res.redirect(redirectUrl.toString());
  }

  @ApiOperation({
    summary: 'New password',
    description: 'This endpoint is used to set a new password',
  })
  @ApiNoContentResponse({
    description: 'If code is valid and new password is accepted',
  })
  @ApiBadRequestResponse({
    description:
      'If the inputModel has incorrect values (recovery code is incorrect, expired or not confirmed or password incorrect)',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(@Body() body: UpdatePasswordInputModel): Promise<void> {
    const updatePasswordResult = await this.commandBus.execute(
      new UpdatePasswordCommand(body),
    );

    return this.sendExceptionOrResponse(updatePasswordResult);
  }

  @ApiOperation({ summary: 'Login user to the system' })
  @ApiOkResponse({
    description:
      'Return accessToken (expired after 30 minutes) in body and refreshToken in cookie (http-only, secure) (expired after 200 minutes).',
    schema: {
      type: 'string',
      example: {
        accessToken: 'string',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'If the inputModel has incorrect values',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiUnauthorizedResponse({ description: 'If password or login is wrong' })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Headers('user-agent') deviceName: string,
    @Headers('origin') origin: string,
    @Body() body: LogInInputModel,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const dto: LogInDTO = {
      email: body.email,
      password: body.password,
      deviceName,
      ip,
    };

    const logInResult = await this.commandBus.execute(new LogInCommand(dto));

    this.sendExceptionOrResponse(logInResult);

    const cookieOptions: CookieOptions = { secure: true };

    if (!origin?.search('localhost')) {
      cookieOptions.httpOnly = true;
    } else {
      cookieOptions.sameSite = 'none';
    }

    res.cookie('refreshToken', logInResult.payload.refreshToken, cookieOptions);

    return { accessToken: logInResult.payload.accessToken };
  }

  @ApiOperation({
    summary: 'Generate new pair of access and refresh tokens',
    description:
      'in cookie client must send correct refreshToken that will be revoked after refreshing',
  })
  @ApiOkResponse({
    description:
      'Returns new pair: accessToken (expired after 30 minutes) in body and refreshToken in cookie (http-only, secure) (expired after 200 minutes).',
    schema: {
      type: 'string',
      example: {
        accessToken: 'string',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'If the refreshToken has incorrect or expired',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Post('refresh-token')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @CurrentUserId() userId: number,
    @RefreshTokenPayload() token: RefreshToken,
    @Headers('origin') origin: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshResult = await this.commandBus.execute(
      new RefreshSessionCommand(userId, token.deviceId, token.iat),
    );

    this.sendExceptionOrResponse(refreshResult);

    const cookieOptions: CookieOptions = { secure: true };

    if (!origin?.search('localhost')) {
      cookieOptions.httpOnly = true;
    } else {
      cookieOptions.sameSite = 'none';
    }

    res.cookie(
      'refreshToken',
      refreshResult.payload.refreshToken,
      cookieOptions,
    );

    return { accessToken: refreshResult.payload.accessToken };
  }

  @ApiOperation({ summary: 'Get information about current user' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserViewModel })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Get('me')
  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUserId() userId: number): Promise<UserViewModel> {
    const userResult = await this.authQueryRepository.getUser(userId);

    return this.sendExceptionOrResponse(userResult);
  }

  @ApiOperation({
    summary:
      'In cookie client must send correct refreshToken that will be revoked',
  })
  @ApiNoContentResponse({ description: 'No Content' })
  @ApiBadRequestResponse({
    description:
      'If refreshToken inside cookie is missing, expired or incorrect',
    schema: BAD_REQUEST_SCHEMA,
  })
  @ApiTooManyRequestsResponse({
    description: 'More than 5 attempts from one IP-address during 10 seconds',
  })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshAuthGuard)
  async logout(
    @CurrentUserId() userId: number,
    @RefreshTokenPayload() token: RefreshToken,
  ): Promise<void> {
    const logOutResult = await this.commandBus.execute(
      new LogOutCommand(userId, token.deviceId, token.iat),
    );

    return this.sendExceptionOrResponse(logOutResult);
  }
}
