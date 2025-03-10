import { ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { TransactionType } from '../../../../libs/db/TransactionType';
import { OauthServicesTypesEnum } from '../../../enums/oauth.services.types.enum';
import {
  ErrorResult,
  InternalErrorCode,
} from '../../../../libs/error-handling/result';
import { PrismaService } from 'prisma/prisma.service';
import { I18nAdapter } from '../../../../libs/i18n/i18n.adapter';
import { UserRepository } from '../../../repositories/user/UserRepository';
import { randomUUID } from 'crypto';
import { TokenService } from '../../services/token.service';

export class BaseOauthCommand {
  constructor(public readonly code: string) {}
}

@Injectable()
export abstract class BaseOauthUseCase<T extends BaseOauthCommand>
  implements ICommandHandler<T>
{
  OAUTH_SERVICE_TYPE: OauthServicesTypesEnum;

  constructor(
    protected prisma: PrismaService,
    protected i18nAdapter: I18nAdapter,
    protected tokenService: TokenService,
    protected usersRepository: UserRepository,
  ) {}

  async execute(command: T) {
    return this.prisma.$transaction(async (tx) => {
      const providerData = await this.getUser(command.code);

      const userData = await this.usersRepository.getByProvider(
        this.OAUTH_SERVICE_TYPE,
        providerData.id,
        tx,
      );
      if (userData) return userData.id;

      const userWithSameEmailAsFromProvider =
        await this.usersRepository.getUser(
          { email: providerData.email },
          { [this.OAUTH_SERVICE_TYPE]: true },
          tx,
        );

      if (userWithSameEmailAsFromProvider) {
        if (userWithSameEmailAsFromProvider[this.OAUTH_SERVICE_TYPE]) {
          const message = await this.i18nAdapter.getMessage('emailExist');

          return new ErrorResult({
            code: InternalErrorCode.Unauthorized,
            extensions: [{ field: 'email', message }],
          });
        }

        await this.connectProviderToUser(
          userWithSameEmailAsFromProvider.id,
          providerData,
          tx,
        );

        return userWithSameEmailAsFromProvider.id;
      }

      const login = await this.generateUniqueLogin(providerData.login, tx);
      const data = {
        email: providerData.email,
        photoUrl: providerData.photoUrl,
        login,
        isEmailConfirmed: true,
      };
      const user = await this.usersRepository.create({ ...data }, tx);
      await this.connectProviderToUser(user.id, providerData, tx);

      const { accessToken, refreshToken } = await this.tokenService.signTokens({
        userId: user.id,
        deviceId: randomUUID(),
        issuedAt: new Date().toISOString(),
      });

      return { accessToken, refreshToken };
    });
  }

  abstract getUser(code: string): Promise<ProviderDataType>;

  async generateUniqueLogin(initialLogin: string, tx: TransactionType) {
    let login = initialLogin;
    let isLastDigitAdded = false;

    while (!!(await this.usersRepository.getUser({ login }, {}, tx))) {
      if (!isLastDigitAdded) {
        isLastDigitAdded = true;
        login = login + '1';
      } else {
        login = login.slice(0, -1) + (parseInt(login.slice(-1)) + 1); // change last digit
      }
    }

    return login;
  }

  async connectProviderToUser(
    userId: number,
    data: ProviderDataType,
    tx: TransactionType,
  ) {
    const mappedData: ConnectProviderType = {
      id: data.id,
      photoUrl: data.photoUrl,
      username: data.login,
      email: data.email,
    };

    return await this.usersRepository.update(
      userId,
      { [this.OAUTH_SERVICE_TYPE]: { create: mappedData } },
      tx,
    );
  }
}

type ConnectProviderType = {
  id: number | string;
  photoUrl: string;
  username: string;
  email: string;
};

export type ProviderDataType = {
  id: number | string;
  login: string;
  email: string;
  photoUrl?: string;
};
