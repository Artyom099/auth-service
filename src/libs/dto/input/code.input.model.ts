import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class CodeInputModel {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  code: string;
}
