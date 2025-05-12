import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OauthInputModel {
  @ApiPropertyOptional()
  @IsString()
  code: string;
}
