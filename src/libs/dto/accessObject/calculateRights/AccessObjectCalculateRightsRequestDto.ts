import { IsString } from 'class-validator';

export class AccessObjectCalculateRightsRequestDto {
  @IsString()
  roleName: string;
}
