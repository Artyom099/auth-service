import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Ip,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CookieOptions, Response } from 'express';

import { LogInDto } from './models/dto/LogInDto';
import { PairTokensType } from './models/dto/pair.tokens.type';
import { CodeInputModel } from './models/input/code.input.model';
import { EmailInputModel } from './models/input/email.input.model';
import { LogInInputModel } from './models/input/log.in.input.model';
import { OauthInputModel } from './models/input/oauth.input.model';
import { RegistrationRequestDto } from './models/input/RegistrationRequestDto';
import { UpdatePasswordRequestDto } from './models/input/UpdatePasswordRequestDto';
import { GetUserInfoResponseDto } from './models/view/GetUserInfoResponseDto';

import { AppConfig } from '../../config';
import { CurrentUserId, RefreshToken } from '../../libs';
import { ResultType, SuccessResult } from '../../libs/error-handling/result';
import {
  ConfirmPasswordRecoveryApi,
  ConfirmRegistrationApi,
  LogInApi,
  LogOutApi,
  MeApi,
  OAuthApi,
  PasswordRecoveryApi,
  RefreshTokenApi,
  RegistrationApi,
  ResendConfirmationCodeApi,
  UpdatePasswordApi,
} from '../../libs/swagger/decorators';
import {
  BaseOauthCommand,
  ConfirmEmailCommand,
  ConfirmPasswordRecoveryCommand,
  LogInCommand,
  LogOutCommand,
  PasswordRecoveryCommand,
  RefreshSessionCommand,
  RegistrationCommand,
  ResendEmailConfirmationCommand,
  UpdatePasswordCommand,
} from '../application';
import { OauthCommandByType } from '../application/use-cases/oauth/utils/OauthCommandByType';
import { OauthServicesTypesEnum } from '../enums/OauthServicesTypesEnum';
import { AuthGuard } from '../guard/AuthGuard';
import { UserQueryRepository } from '../repositories';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private REFRESH_TOKEN_COOKIE_KEY = 'refreshToken';
  private ACCESS_TOKEN_COOKIE_KEY = 'accessToken';
  private cookieOptions: CookieOptions;

  constructor(
    private commandBus: CommandBus,
    private userQueryRepository: UserQueryRepository,
    @Inject(AppConfig.name) private appConfig: AppConfig,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: !appConfig.env.isDevelopment() ? ('none' as const) : false,
      secure: !appConfig.env.isDevelopment(),
    };
  }

  @RegistrationApi()
  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  async registration(@Body() body: RegistrationRequestDto): Promise<{ userId: string }> {
    return this.commandBus.execute(new RegistrationCommand(body));
  }

  @ConfirmRegistrationApi()
  @Post('registration-confirmation')
  @HttpCode(HttpStatus.OK)
  async confirmRegistration(@Body() body: CodeInputModel): Promise<void> {
    return this.commandBus.execute(new ConfirmEmailCommand(body.code));
  }

  @ResendConfirmationCodeApi()
  @Post('resend-confirmation-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendConfirmationCode(@Body() body: EmailInputModel): Promise<void> {
    return this.commandBus.execute(new ResendEmailConfirmationCommand(body.email));
  }

  @PasswordRecoveryApi()
  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: EmailInputModel): Promise<void> {
    return this.commandBus.execute(new PasswordRecoveryCommand(body.email));
  }

  @ConfirmPasswordRecoveryApi()
  @Post('confirm-password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPasswordRecovery(@Body() body: CodeInputModel): Promise<void> {
    return this.commandBus.execute(new ConfirmPasswordRecoveryCommand(body.code));
  }

  @UpdatePasswordApi()
  @Post('update-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(@Body() body: UpdatePasswordRequestDto): Promise<void> {
    return this.commandBus.execute(new UpdatePasswordCommand(body));
  }

  @LogInApi()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Headers('user-agent') deviceName: string,
    @Body() body: LogInInputModel,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResultType<PairTokensType>> {
    const dto: LogInDto = {
      email: body.email,
      password: body.password,
      deviceName,
      ip,
    };

    let logInResult = await this.commandBus.execute<unknown, ResultType<any>>(new LogInCommand(dto));

    if (logInResult.hasError) {
      return logInResult;
    }

    logInResult = logInResult as SuccessResult<any>;
    const { accessToken, refreshToken } = logInResult.payload;

    res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, refreshToken, this.cookieOptions);
    res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);
    return logInResult;
  }

  @RefreshTokenApi()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @RefreshToken() token: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResultType<PairTokensType>> {
    let refreshResult = await this.commandBus.execute<unknown, ResultType<any>>(new RefreshSessionCommand(token));

    if (refreshResult.hasError) {
      return refreshResult;
    }

    refreshResult = refreshResult as SuccessResult<any>;
    const { accessToken, refreshToken } = refreshResult.payload;

    res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, refreshToken, this.cookieOptions);
    res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);
    return refreshResult;
  }

  @MeApi()
  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUserId() userId: string): Promise<GetUserInfoResponseDto> {
    return this.userQueryRepository.getUserInfo(userId);
  }

  @LogOutApi()
  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUserId() userId: string, @RefreshToken() token: string): Promise<void> {
    return this.commandBus.execute(new LogOutCommand(userId, token));
  }

  @OAuthApi()
  @Post('oauth/:type')
  async authenticateThroughOauth(
    @Param('type') type: OauthServicesTypesEnum,
    @Body() body: OauthInputModel,
    @Res({ passthrough: true }) res: Response,
  ) {
    const OauthCommand = OauthCommandByType[type];

    if (!OauthCommand) throw new BadRequestException();

    try {
      const { accessToken, refreshToken } = await this.commandBus.execute<BaseOauthCommand, PairTokensType>(
        new OauthCommand(body.code),
      );

      res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, refreshToken, this.cookieOptions);
      res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);

      return { accessToken };
    } catch (e) {
      console.log({ oauth_endpoint: e });
      throw new BadRequestException();
    }
  }
}
