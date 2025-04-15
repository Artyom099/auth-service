import { Injectable } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { EntityManager } from 'typeorm';

import { TokenService } from './TokenService';

import { ErrorResult, InternalErrorCode, ResultType, SuccessResult } from '../../../libs/error-handling/result';
import { DeviceRepository, UserTypeOrmRepository } from '../../repositories';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private userRepository: UserTypeOrmRepository,
    private deviceRepository: DeviceRepository,
  ) {}

  /**
   * Метод проверяет валидность пользователя
   */
  async validateUser(
    em: EntityManager,
    email: string,
    password: string,
    originalPasswordHash?: string,
  ): Promise<ResultType<null>> {
    let passwordHash: string;

    if (!originalPasswordHash) {
      const user = await this.userRepository.getUserByLoginOrEmail(em, email);

      passwordHash = user.passwordHash;
    } else {
      passwordHash = originalPasswordHash;
    }

    const isUserValid = await compare(password, passwordHash);

    if (!isUserValid) {
      const message = 'Wrong password';
      const field = 'password';

      return new ErrorResult({
        code: InternalErrorCode.BadRequest,
        extensions: [{ field, message }],
      });
    }

    return new SuccessResult(null);
  }

  /**
   * Метод проверяет валидность токена
   */
  // async validateRefreshToken(userId: string, token: string): Promise<ResultType<any>> {
  //   const payload = await this.tokenService.verifyRefreshToken(token);
  //   const tokenIssuedAt = payload.issuedAt;
  //
  //   const device = await this.deviceRepository.getDevice(payload.deviceId);
  //
  //   if (!device)
  //     return new ErrorResult({
  //       code: InternalErrorCode.Unauthorized,
  //       extensions: [],
  //     });
  //
  //   const deviceIssuedAt = device.issuedAt.toISOString();
  //
  //   if (userId !== device.userId || tokenIssuedAt !== deviceIssuedAt)
  //     return new ErrorResult({
  //       code: InternalErrorCode.Unauthorized,
  //       extensions: [],
  //     });
  //
  //   return new SuccessResult(payload);
  // }
}
