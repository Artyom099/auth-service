import * as process from 'process';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export type EnvironmentVariable = { [key: string]: string | undefined };

export type EnvironmentsTypes = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST';

export class EnvironmentSettings {
  constructor(private env: EnvironmentsTypes) {}

  getEnv() {
    return this.env;
  }

  isProduction() {
    return this.env === 'PRODUCTION';
  }

  isStaging() {
    return this.env === 'STAGING';
  }

  isDevelopment() {
    return this.env === 'DEVELOPMENT';
  }

  isTest() {
    return this.env === 'TEST';
  }
}

export type SettingsType = {
  origin: OriginSettings;
  email: EmailSettings;
  jwt: JwtSettings;
  oauth: OauthSettings;
  backend: BackData;
  // frontend: FrontData;
};

export class OriginSettings {
  FRONTEND_URLS: string;

  constructor(envVariables: EnvironmentVariable) {
    this.FRONTEND_URLS = envVariables.FRONTEND_URLS!;
  }
}

export class EmailSettings {
  EMAIL_HOST: string;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;

  constructor(envVariables: EnvironmentVariable) {
    this.EMAIL_HOST = envVariables.EMAIL_HOST!;
    this.EMAIL_USER = envVariables.EMAIL_USER!;
    this.EMAIL_PASSWORD = envVariables.EMAIL_PASSWORD!;
  }
}

export class JwtSettings {
  SECRET: string;
  PASSPHRASE: string;
  PUBLIC_KEY: string;
  PRIVATE_KEY: string;
  ACCESS_TOKEN_LIFETIME_SECONDS: number;
  REFRESH_TOKEN_LIFETIME_SECONDS: number;
  ENCRYPTION_TYPE: string;

  constructor(envVariables: EnvironmentVariable) {
    this.SECRET = envVariables.SECRET!;
    this.PASSPHRASE = envVariables.PASSPHRASE!;
    this.PUBLIC_KEY = decodeURIComponent(envVariables.PUBLIC_KEY!);
    this.PRIVATE_KEY = decodeURIComponent(envVariables.PRIVATE_KEY!);
    this.ACCESS_TOKEN_LIFETIME_SECONDS = Number(envVariables.ACCESS_TOKEN_LIFETIME_SECONDS!);
    this.REFRESH_TOKEN_LIFETIME_SECONDS = Number(envVariables.REFRESH_TOKEN_LIFETIME_SECONDS!);
    this.ENCRYPTION_TYPE = envVariables.ENCRYPTION_TYPE!;
  }
}

export class BackData {
  PORT: string;
  CURRENT_DOMAIN_URL: string;

  constructor(envVariables: EnvironmentVariable) {
    this.PORT = envVariables.PORT!;
    this.CURRENT_DOMAIN_URL = envVariables.CURRENT_DOMAIN_URL!;
    // .split('.')
    // .splice(1, 4)
    // .join('.');
  }
}

// export class FrontData {
//   FRONTEND_PASSWORD_RESET_URL: string;
//   FRONTEND_EMAIL_CONFIRMATION_URL: string;
//
//   constructor(envVariables: EnvironmentVariable) {
//     this.FRONTEND_PASSWORD_RESET_URL = envVariables.FRONTEND_PASSWORD_RESET_URL!;
//     this.FRONTEND_EMAIL_CONFIRMATION_URL = envVariables.FRONTEND_EMAIL_CONFIRMATION_URL!;
//   }
// }

export type OauthParamsType = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  CLIENT_REDIRECT_URI: string;
};

export type TOauthVkParams = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  CLIENT_REDIRECT_URI: string;
  TOKEN_URL: string;
  API_URL: string;
  API_VERSION: string;
};

export class OauthSettings {
  GITHUB: OauthParamsType;
  GOOGLE: OauthParamsType;
  VK: TOauthVkParams;
  YANDEX: OauthParamsType;

  constructor(envVariables: EnvironmentVariable) {
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
    this.VK = {
      CLIENT_ID: envVariables.VK_CLIENT_ID!,
      CLIENT_SECRET: envVariables.VK_CLIENT_SECRET!,
      CLIENT_REDIRECT_URI: envVariables.VK_REDIRECT_URI!,
      TOKEN_URL: envVariables.VK_TOKEN_URL!,
      API_URL: envVariables.VK_API_URL!,
      API_VERSION: envVariables.VK_API_VERSION!,
    };
    this.YANDEX = {
      CLIENT_ID: envVariables.YANDEX_CLIENT_ID!,
      CLIENT_SECRET: envVariables.YANDEX_CLIENT_SECRET!,
      CLIENT_REDIRECT_URI: envVariables.YANDEX_REDIRECT_URI!,
    };
  }
}

export class AppConfig {
  constructor(
    public readonly env: EnvironmentSettings,
    public readonly settings: SettingsType,
  ) {
    console.log({ env });
    console.dir({ settings }, { depth: 10 });
  }
}

const envSettings = new EnvironmentSettings((process.env.ENV_TYPE || 'DEVELOPMENT') as EnvironmentsTypes);

const originSettings = new OriginSettings(process.env);
const emailSettings = new EmailSettings(process.env);
const jwtSettings = new JwtSettings(process.env);
const backData = new BackData(process.env);
// const frontData = new FrontData(process.env);
const oauthSettings = new OauthSettings(process.env);

export const appConfig = new AppConfig(envSettings, {
  origin: originSettings,
  email: emailSettings,
  jwt: jwtSettings,
  backend: backData,
  oauth: oauthSettings,
  // frontend: frontData,
});
