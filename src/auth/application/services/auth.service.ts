import { UserRepository } from '../../repositories/user/user.repository';
import { Injectable } from '@nestjs/common';
import {
  ErrorResult,
  InternalErrorCode,
  ResultType,
  SuccessResult,
} from '../../../infrastructure/error-handling/result';
import { compare } from 'bcryptjs';
import { TransactionType } from '../../../infrastructure/database/transaction.type';
import { TokenService } from './token.service';
import { DeviceRepository } from '../../repositories/device/device.repository';
import { I18nAdapter } from '../../../i18n/i18n.adapter';

@Injectable()
export class AuthService {
  constructor(
    private i18nAdapter: I18nAdapter,
    private tokenService: TokenService,
    private userRepository: UserRepository,
    private deviceRepository: DeviceRepository,
  ) {}

  async validateUser(
    email: string,
    password: string,
    originalPasswordHash?: string,
    tx?: TransactionType,
  ): Promise<ResultType<null>> {
    let passwordHash: string;

    if (!originalPasswordHash) {
      const user = await this.userRepository.getUserByLoginOrEmail(email, tx);

      passwordHash = user.passwordHash;
    } else {
      passwordHash = originalPasswordHash;
    }

    const isUserValid = await compare(password, passwordHash);

    if (!isUserValid) {
      const message = await this.i18nAdapter.getMessage('wrongPassword');
      const field = 'password';

      return new ErrorResult({
        code: InternalErrorCode.BadRequest,
        extensions: [{ field, message }],
      });
    }

    return new SuccessResult(null);
  }

  async validateRefreshToken(
    userId: number,
    token: string,
    tx?: TransactionType,
  ): Promise<ResultType<any>> {
    const payload = await this.tokenService.verifyRefreshToken(token);
    const tokenIssuedAt = payload.issuedAt;

    const device = await this.deviceRepository.getDevice(payload.deviceId, tx);

    if (!device)
      return new ErrorResult({
        code: InternalErrorCode.Unauthorized,
        extensions: [],
      });

    const deviceIssuedAt = device.issuedAt.toISOString();

    if (userId !== device.userId || tokenIssuedAt !== deviceIssuedAt)
      return new ErrorResult({
        code: InternalErrorCode.Unauthorized,
        extensions: [],
      });

    return new SuccessResult(payload);
  }
}
