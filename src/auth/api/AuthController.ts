import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CookieOptions, Response } from 'express';

import { AppConfig } from '../../config';
import { CurrentUserId, RefreshToken } from '../../libs/decorators';
import { GetUserInfoResponseDto } from '../../libs/dto';
import { ConfirmationCodeRequestDto } from '../../libs/dto/input/ConfirmationCodeRequestDto';
import { EmailRequestDto } from '../../libs/dto/input/EmailRequestDto';
import { LogInRequestDto } from '../../libs/dto/input/LogInRequestDto';
import { OauthInputModel } from '../../libs/dto/input/oauth.input.model';
import { RegistrationRequestDto } from '../../libs/dto/input/RegistrationRequestDto';
import { UpdatePasswordRequestDto } from '../../libs/dto/input/UpdatePasswordRequestDto';
import { LogInDto } from '../../libs/dto/LogInDto';
import { OauthServicesTypesEnum } from '../../libs/enums/OauthServicesTypesEnum';
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
} from '../../libs/swagger';
import { TPairTokens } from '../../libs/types';
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
import { AuthGuard } from '../guard';
import { UserQueryRepository } from '../repositories';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly REFRESH_TOKEN_COOKIE_KEY = 'refreshToken';
  private readonly ACCESS_TOKEN_COOKIE_KEY = 'accessToken';
  private readonly cookieOptions: CookieOptions;

  constructor(
    private commandBus: CommandBus,
    private userQueryRepository: UserQueryRepository,
    @Inject(AppConfig.name)
    private appConfig: AppConfig,
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
  async confirmRegistration(@Body() body: ConfirmationCodeRequestDto): Promise<void> {
    return this.commandBus.execute(new ConfirmEmailCommand(body.code));
  }

  @ResendConfirmationCodeApi()
  @Post('resend-confirmation-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendConfirmationCode(@Body() body: EmailRequestDto): Promise<void> {
    return this.commandBus.execute(new ResendEmailConfirmationCommand(body.email));
  }

  @PasswordRecoveryApi()
  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: EmailRequestDto): Promise<void> {
    return this.commandBus.execute(new PasswordRecoveryCommand(body.email));
  }

  @ConfirmPasswordRecoveryApi()
  @Post('confirm-password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPasswordRecovery(@Body() body: ConfirmationCodeRequestDto): Promise<void> {
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
    // @Ip() ip: string, // непонятно, какой заголовок парсит декоратор
    @Headers('user-agent') deviceName: string,
    @Headers('X-Forwarded-For') ip: string,
    @Body() body: LogInRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResultType<TPairTokens>> {
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
  ): Promise<ResultType<TPairTokens>> {
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
  @Get('me') // user/get_info
  @HttpCode(HttpStatus.OK)
  async getUserInfo(@CurrentUserId() userId: string): Promise<GetUserInfoResponseDto> {
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
      const { accessToken, refreshToken } = await this.commandBus.execute<BaseOauthCommand, TPairTokens>(
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
