import { BaseOauthCommand } from './base-oauth.use-case';
// import { lastValueFrom } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { CommandHandler } from '@nestjs/cqrs';
// import { UserOauthServicesTypesEnum } from '../../../../enums/UserOauthServicesTypes.enum';
// import { UsersRepository } from '../../../../repositories/users-repository.service';
// import { HttpService } from '@nestjs/axios';
// import { AppConfig } from '../../../../../config/app-config';

export class OfferHeapOauthCommand extends BaseOauthCommand {}

// @CommandHandler(OfferHeapOauthCommand)
// export class OfferheapOauthUseCase extends BaseOauthUseCase<
//   OfferHeapOauthCommand,
//   UserOauthServicesTypesEnum.OFFERHEAP
// > {
//   OAUTH_SERVICE_TYPE = UserOauthServicesTypesEnum.OFFERHEAP;
//
//   constructor(
//     private httpService: HttpService,
//     private appConfig: AppConfig,
//     usersRepository: UsersRepository,
//   ) {
//     super(usersRepository);
//   }
//
//   async getUser(code: string) {
//     const { access_token, refresh_token } = await this.getOfferheapTokens(code);
//     const user = await this.getOfferheapUserByAccessToken(access_token);
//
//     await this.logoutOfferHeap({ access_token, refresh_token });
//
//     return this.mapOfferheapUserToSchemaType(user);
//   }
//
//   protected async getOfferheapTokens(code: string) {
//     const params: OauthRequestParamsType = {
//       ...this.getBaseParams(),
//       redirect_uri: this.appConfig.settings.oauth.OFFERHEAP.CLIENT_REDIRECT_URI,
//       code,
//     };
//
//     return lastValueFrom(
//       this.httpService
//         .post<OauthResponseDataType>(
//           this.appConfig.oauth.OFFERHEAP.OAUTH_URL,
//           params,
//           {
//             headers: {
//               'Content-Type': 'application/x-www-form-urlencoded',
//             },
//           },
//         )
//         .pipe(map((res) => res.data)),
//     );
//   }
//
//   protected async getOfferheapUserByAccessToken(
//     access_token: string,
//   ): Promise<OfferheapUserDataType> {
//     return lastValueFrom(
//       this.httpService
//         .get<OfferheapUserDataType>(
//           this.appConfig.settings.oauth.OFFERHEAP.AUTH_ME_URL,
//           {
//             headers: {
//               Authorization: `Bearer ${access_token}`,
//             },
//           },
//         )
//         .pipe(map((res) => res.data)),
//     );
//   }
//
//   protected mapOfferheapUserToSchemaType(
//     user: OfferheapUserDataType,
//   ): UserOauthServiceFieldsType<OfferheapAdditionalDataType> {
//     const {
//       offerheapId: id,
//       email,
//       preferred_username: username,
//       imageUrl,
//       ...additionalData
//     } = user;
//     return {
//       id,
//       imageUrl,
//       email,
//       username,
//       additionalData,
//     };
//   }
//
//   protected async logoutOfferHeap({
//     access_token,
//     refresh_token,
//   }: OauthResponseDataType) {
//     const params = { ...this.getBaseParams(), refresh_token };
//
//     await lastValueFrom(
//       this.httpService.post(this.appConfig.oauth.OFFERHEAP.LOGOUT_URL, params, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           Authorization: `Bearer ${access_token}`,
//         },
//       }),
//     );
//   }
//
//   protected getBaseParams() {
//     return {
//       grant_type: 'authorization_code' as const,
//       client_id: this.appConfig.oauth.OFFERHEAP.CLIENT_ID,
//       client_secret: this.appConfig.oauth.OFFERHEAP.CLIENT_SECRET,
//     };
//   }
// }
//
// type OauthRequestParamsType = {
//   grant_type: 'authorization_code';
//   client_id: string;
//   client_secret: string;
//   redirect_uri: string;
//   code: string;
// };
//
// type OauthResponseDataType = {
//   refresh_token: string;
//   access_token: string;
// };
//
// export type OfferheapUserDataType = {
//   offerheapId: string;
//   preferred_username: string;
//   email: string;
//   imageUrl: string;
//   email_verified: boolean;
//   sub: string;
// };
//
// export type OfferheapAdditionalDataType = Omit<
//   OfferheapUserDataType,
//   'offerheapId' | 'email' | 'preferred_username' | 'imageUrl'
// >;
