import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RoleCreateRequestDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  description: string;
}
