import { IsString } from 'class-validator';

export class RoleGetTreeRequestDto {
  @IsString()
  name: string;
}
