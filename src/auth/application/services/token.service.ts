import { JwtService } from '@nestjs/jwt';
import { Inject, Injectable } from '@nestjs/common';
import { AppConfig } from '../../../config/app-config';
import { RefreshTokenPayloadType } from '../../presentation/auth/models/dto/refresh.token.payload.type';
import { PairTokensType } from '../../presentation/auth/models/dto/pair.tokens.type';
import { AccessTokenPayloadType } from '../../presentation/auth/models/dto/access.token.payload.type';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    @Inject(AppConfig.name) private appConfig: AppConfig,
  ) {}

  async signTokens(payload: RefreshTokenPayloadType): Promise<PairTokensType> {
    const accessToken = await this.jwtService.signAsync(
      { userId: payload.userId },
      { expiresIn: this.appConfig.settings.jwt.ACCESS_TOKEN_LIFETIME_SECONDS },
    );

    const refreshToken = await this.jwtService.signAsync(
      { payload },
      { expiresIn: this.appConfig.settings.jwt.REFRESH_TOKEN_LIFETIME_SECONDS },
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayloadType> {
    return this.jwtService.verifyAsync(token);
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayloadType> {
    const tokenInfo = await this.jwtService.verifyAsync(token);

    return tokenInfo.payload;
  }
}
