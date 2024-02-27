import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogInInputModel {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  email: string;
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  password: string;
}
