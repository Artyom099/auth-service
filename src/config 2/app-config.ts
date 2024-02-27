import * as process from 'process';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export type EnvironmentVariable = { [key: string]: string | undefined };

export type EnvironmentsTypes =
  | 'DEVELOPMENT'
  | 'STAGING'
  | 'PRODUCTION'
  | 'TEST';

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
  storage: StorageSettings;
  origin: OriginSettings;
  // email: EmailSettings;
  // jwt: JwtSettings;
};

export class OriginSettings {
  FRONTEND_URLS: string;

  constructor(envVariables: EnvironmentVariable) {
    this.FRONTEND_URLS = envVariables.FRONTEND_URLS!;
  }
}

export class StorageSettings {
  BASE_URL: string;
  STORAGE_TOKEN: string;

  constructor(envVariables: EnvironmentVariable) {
    this.BASE_URL = envVariables.STORAGE_BASE_URL!;
    this.STORAGE_TOKEN = envVariables.STORAGE_TOKEN!;
  }
}

export class AppConfig {
  constructor(
    public readonly env: EnvironmentSettings,
    public readonly settings: SettingsType,
  ) {
    console.log(settings);
  }
}

const envSettings = new EnvironmentSettings(
  (process.env.ENV || 'DEVELOPMENT') as EnvironmentsTypes,
);
const originSettings = new OriginSettings(process.env);
const storageSettings = new StorageSettings(process.env);

export const appConfig = new AppConfig(envSettings, {
  origin: originSettings,
  storage: storageSettings,
});
