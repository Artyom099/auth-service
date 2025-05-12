import { OauthServicesTypesEnum } from 'src/libs/enums/OauthServicesTypesEnum';

import { BaseOauthCommand } from '../BaseOauthUseCase';
import { GithubOauthCommand } from '../GithubOauthUseCase';
import { GoogleOauthCommand } from '../GoogleOauthUseCase';

export const OauthCommandByType: {
  [key in OauthServicesTypesEnum]: typeof BaseOauthCommand;
} = {
  [OauthServicesTypesEnum.GITHUB]: GithubOauthCommand,
  [OauthServicesTypesEnum.GOOGLE]: GoogleOauthCommand,
};
