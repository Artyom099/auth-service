import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CodeInputModel {
  @ApiProperty()
  @IsString()
  @IsUUID('all', { message: i18nValidationMessage('error.IS_UUID') })
  @Transform(({ value }) => value.trim())
  code: string;
}
