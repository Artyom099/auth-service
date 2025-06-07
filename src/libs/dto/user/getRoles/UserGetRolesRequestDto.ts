import { IsString } from 'class-validator';

export class UserGetRolesRequestDto {
  @IsString()
  userId: string;
}
