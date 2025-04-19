import { Injectable } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { randomUUID } from 'crypto';

import { ConnectProviderType, ProviderDataType } from './utils/types';

import { ErrorResult, InternalErrorCode } from '../../../../libs/error-handling/result';
import { OauthServicesTypesEnum } from '../../../enums/OauthServicesTypesEnum';
import { UserTypeOrmRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class BaseOauthCommand {
  constructor(public readonly code: string) {}
}

@Injectable()
export abstract class BaseOauthUseCase<T extends BaseOauthCommand> implements ICommandHandler<T> {
  OAUTH_SERVICE_TYPE: OauthServicesTypesEnum;

  constructor(
    protected manager: EntityManager,
    protected tokenService: TokenService,
    protected usersRepository: UserTypeOrmRepository,
  ) {}

  async execute(command: T) {
    return this.manager.transaction(async (em) => {
      const providerData = await this.getUser(command.code);

      const userData = await this.usersRepository.getByProvider(em, this.OAUTH_SERVICE_TYPE, providerData.id);
      if (userData) return userData.id;

      const userWithSameEmailAsFromProvider = await this.usersRepository.getUser(
        em,
        { email: providerData.email },
        { [this.OAUTH_SERVICE_TYPE]: true },
      );

      if (userWithSameEmailAsFromProvider) {
        if (userWithSameEmailAsFromProvider[this.OAUTH_SERVICE_TYPE]) {
          const message = 'Email already exists';

          return new ErrorResult({
            code: InternalErrorCode.Unauthorized,
            extensions: [{ field: 'email', message }],
          });
        }

        await this.connectProviderToUser(em, userWithSameEmailAsFromProvider.id, providerData);

        return userWithSameEmailAsFromProvider.id;
      }

      const login = await this.generateUniqueLogin(em, providerData.login);
      const data = {
        email: providerData.email,
        photoUrl: providerData.photoUrl,
        login,
        isEmailConfirmed: true,
      };
      const userId = await this.usersRepository.create(em, data);
      await this.connectProviderToUser(em, userId, providerData);

      const { accessToken, refreshToken } = await this.tokenService.signTokens({
        userId,
        deviceId: randomUUID(),
        issuedAt: new Date().toISOString(),
      });

      return { accessToken, refreshToken };
    });
  }

  async generateUniqueLogin(em: EntityManager, initialLogin: string) {
    let login = initialLogin;
    let isLastDigitAdded = false;

    while (!!(await this.usersRepository.getUser(em, { login }))) {
      if (!isLastDigitAdded) {
        isLastDigitAdded = true;
        login = login + '1';
      } else {
        login = login.slice(0, -1) + (parseInt(login.slice(-1)) + 1); // change last digit
      }
    }

    return login;
  }

  async connectProviderToUser(em: EntityManager, userId: string, data: ProviderDataType) {
    const mappedData: ConnectProviderType = {
      id: data.id,
      photoUrl: data.photoUrl,
      username: data.login,
      email: data.email,
    };

    return await this.usersRepository.connectProviderToUser(em, userId.toString(), {
      [this.OAUTH_SERVICE_TYPE]: { create: mappedData },
    });
  }

  abstract getUser(code: string): Promise<ProviderDataType>;
}
