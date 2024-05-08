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
import { CookieOptions, Response } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { RegistrationInputModel } from './models/input/registration.input.model';
import { EmailInputModel } from './models/input/email.input.model';
import { LogInInputModel } from './models/input/log.in.input.model';
import { UserViewModel } from './models/view/user.view.model';
import { UpdatePasswordInputModel } from './models/input/update.password.input.model';
import { RegistrationCommand } from '../../application/use-cases/auth/registration.use.case';
import { LogOutCommand } from '../../application/use-cases/auth/log.out.use.case';
import { UpdatePasswordCommand } from '../../application/use-cases/password-recovery/update.password.use.case';
import { LogInCommand } from '../../application/use-cases/auth/log.in.use.case';
import { LogInDTO } from './models/dto/log.in.dto';
import { ResendEmailConfirmationCommand } from '../../application/use-cases/email-confirmation/resend.email.confirmation.use.case';
import { PasswordRecoveryCommand } from '../../application/use-cases/password-recovery/password.recovery.use.case';
import { RefreshSessionCommand } from '../../application/use-cases/auth/refresh.session.use.case';
import { ConfirmPasswordRecoveryCommand } from '../../application/use-cases/password-recovery/confirm.password.recovery.use.case';
import { ConfirmEmailCommand } from '../../application/use-cases/email-confirmation/confirm.email.use.case';
import { CurrentUserId } from '../../decorators/current.user.id.decorator';
import { RefreshToken } from '../../decorators/refresh.token.decorator';
import { CodeInputModel } from './models/input/code.input.model';
import { LogInEndpoint } from './swagger-docs/log.in.endpoint';
import { RefreshTokenEndpoint } from './swagger-docs/refresh.token.endpoint';
import { MeEndpoint } from './swagger-docs/me.endpoint';
import { LogOutEndpoint } from './swagger-docs/log.out.endpoint';
import { UpdatePasswordEndpoint } from './swagger-docs/update.password.endpoint';
import { ConfirmPasswordRecoveryEndpoint } from './swagger-docs/confirm.password.recovery.endpoint';
import { PasswordRecoveryEndpoint } from './swagger-docs/password.recovery.endpoint';
import { ResendConfirmationCodeEndpoint } from './swagger-docs/resend.confirmation.code.endpoint';
import { ConfirmRegistrationEndpoint } from './swagger-docs/confirm.registration.endpoint';
import { RegistrationEndpoint } from './swagger-docs/registration.endpoint';
import { AuthGuard } from '../../guard/auth.guard';
import {
  ResultType,
  SuccessResult,
} from '../../../infrastructure/error-handling/result';
import { ApiTags } from '@nestjs/swagger';
import { UserQueryRepository } from '../../repositories/user/user.query.repository';
import { AppConfig } from '../../../config/app-config';
import { PairTokensType } from './models/dto/pair.tokens.type';
import { OauthInputModel } from './models/input/oauth.input.model';
import { UserOauthServicesTypesEnum } from '../../enums/user.oauth.services.types.enum';
import { GoogleOauthCommand } from '../../application/use-cases/auth/oauth/google.oauth.use-case';
import { GithubOauthCommand } from '../../application/use-cases/auth/oauth/github-oauth.use-case';
import { BaseOauthCommand } from '../../application/use-cases/auth/oauth/base-oauth.use-case';
import { OAuthEndpoint } from './swagger-docs/oauth.endpoint';

const OauthCommandByType: {
  [key in UserOauthServicesTypesEnum]: typeof BaseOauthCommand;
} = {
  [UserOauthServicesTypesEnum.GITHUB]: GithubOauthCommand,
  [UserOauthServicesTypesEnum.GOOGLE]: GoogleOauthCommand,
};

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

  @RegistrationEndpoint()
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: RegistrationInputModel): Promise<void> {
    return this.commandBus.execute(new RegistrationCommand(body));
  }

  @ConfirmRegistrationEndpoint()
  @Post('registration-confirmation')
  async confirmRegistration(@Body() body: CodeInputModel): Promise<void> {
    return this.commandBus.execute(new ConfirmEmailCommand(body.code));
  }

  @ResendConfirmationCodeEndpoint()
  @Post('resend-confirmation-code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendConfirmationCode(@Body() body: EmailInputModel): Promise<void> {
    return this.commandBus.execute(
      new ResendEmailConfirmationCommand(body.email),
    );
  }

  @OAuthEndpoint()
  @Post('oauth/:type')
  async authenticateThroughOauth(
    @Param('type') type: UserOauthServicesTypesEnum,
    @Body() body: OauthInputModel,
    @Res({ passthrough: true }) res: Response,
  ) {
    const OauthCommand = OauthCommandByType[type];

    if (!OauthCommand) throw new BadRequestException();

    try {
      const { accessToken, refreshToken } = await this.commandBus.execute<
        BaseOauthCommand,
        PairTokensType
      >(new OauthCommand(body.code));

      res.cookie(
        this.REFRESH_TOKEN_COOKIE_KEY,
        refreshToken,
        this.cookieOptions,
      );
      res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);

      return { accessToken };
    } catch (e) {
      console.log({ oauth_endpoint: e });
      throw new BadRequestException();
    }
  }

  @PasswordRecoveryEndpoint()
  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() body: EmailInputModel): Promise<void> {
    return this.commandBus.execute(new PasswordRecoveryCommand(body.email));
  }

  @ConfirmPasswordRecoveryEndpoint()
  @Post('confirm-password-recovery')
  async confirmPasswordRecovery(@Body() body: CodeInputModel): Promise<void> {
    return this.commandBus.execute(
      new ConfirmPasswordRecoveryCommand(body.code),
    );
  }

  @UpdatePasswordEndpoint()
  @Post('update-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(@Body() body: UpdatePasswordInputModel): Promise<void> {
    return this.commandBus.execute(new UpdatePasswordCommand(body));
  }

  @LogInEndpoint()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Headers('user-agent') deviceName: string,
    @Body() body: LogInInputModel,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResultType<PairTokensType>> {
    const dto: LogInDTO = {
      email: body.email,
      password: body.password,
      deviceName,
      ip,
    };

    let logInResult = await this.commandBus.execute<unknown, ResultType<any>>(
      new LogInCommand(dto),
    );

    if (logInResult.hasError) return logInResult;

    logInResult = logInResult as SuccessResult<any>;
    const { accessToken, refreshToken } = logInResult.payload;

    res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, refreshToken, this.cookieOptions);
    res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);
    return logInResult;
  }

  @RefreshTokenEndpoint()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshSession(
    @RefreshToken() token: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResultType<PairTokensType>> {
    let refreshResult = await this.commandBus.execute<unknown, ResultType<any>>(
      new RefreshSessionCommand(token),
    );

    if (refreshResult.hasError) return refreshResult;

    refreshResult = refreshResult as SuccessResult<any>;
    const { accessToken, refreshToken } = refreshResult.payload;

    res.cookie(this.REFRESH_TOKEN_COOKIE_KEY, refreshToken, this.cookieOptions);
    res.cookie(this.ACCESS_TOKEN_COOKIE_KEY, accessToken, this.cookieOptions);
    return refreshResult;
  }

  @MeEndpoint()
  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUserId() userId: number): Promise<UserViewModel> {
    return this.userQueryRepository.getUser(userId);
  }

  @LogOutEndpoint()
  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUserId() userId: number,
    @RefreshToken() token: string,
  ): Promise<void> {
    return this.commandBus.execute(new LogOutCommand(userId, token));
  }
}
