import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AppConfig } from '../../../config';
import { TAccessTokenPayload, TPairTokens, TRefreshTokenPayload } from '../../../libs/types';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    @Inject(AppConfig.name)
    private appConfig: AppConfig,
  ) {}

  async signTokens(payload: TRefreshTokenPayload): Promise<TPairTokens> {
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

  async verifyAccessToken(token: string): Promise<TAccessTokenPayload> {
    return this.jwtService.verifyAsync(token);
  }

  async verifyRefreshToken(token: string): Promise<TRefreshTokenPayload> {
    const tokenInfo = await this.jwtService.verifyAsync(token);

    return tokenInfo.payload;
  }
}
