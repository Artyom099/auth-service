import { IsString } from 'class-validator';

export class RightReassignRequestDto {
  @IsString()
  roleName: string;

  @IsString({ each: true })
  actionNames: string[];
}
