import { IsString } from 'class-validator';

export class UserRoleCreateDto {
  @IsString()
  userId: string;

  @IsString()
  roleName: string;
}
