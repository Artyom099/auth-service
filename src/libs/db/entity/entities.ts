import { Device } from './Device';
import { OauthVkUser } from './OauthVkUser';
import { User } from './User';
import { UserEmailConfirmation } from './UserEmailConfirmation';
import { UserPasswordRecovery } from './UserPasswordRecovery';

export const entities = [User, Device, UserEmailConfirmation, UserPasswordRecovery, OauthVkUser];
