import { EnvironmentVariable } from '../app-config';

export type OauthParamsType = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  CLIENT_REDIRECT_URI: string;
};

export class OauthSettings {
  OFFERHEAP: OauthParamsType;
  GITHUB: OauthParamsType;
  GOOGLE: OauthParamsType;

  constructor(envVariables: EnvironmentVariable) {
    this.OFFERHEAP = {
      CLIENT_ID: envVariables.OFFERHEAP_CLIENT_ID!,
      CLIENT_SECRET: envVariables.OFFERHEAP_CLIENT_SECRET!,
      CLIENT_REDIRECT_URI: envVariables.OFFERHEAP_CLIENT_REDIRECT_URI!,
    };
    this.GITHUB = {
      CLIENT_ID: envVariables.GITHUB_CLIENT_ID!,
      CLIENT_SECRET: envVariables.GITHUB_CLIENT_SECRET!,
      CLIENT_REDIRECT_URI: envVariables.GITHUB_CLIENT_REDIRECT_URI!,
    };
    this.GOOGLE = {
      CLIENT_ID: envVariables.GOOGLE_CLIENT_ID!,
      CLIENT_SECRET: envVariables.GOOGLE_CLIENT_SECRET!,
      CLIENT_REDIRECT_URI: envVariables.GOOGLE_CLIENT_REDIRECT_URI!,
    };
  }
}
