import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class EmailInputModel {
  @ApiProperty({
    minimum: 6,
    maximum: 80,
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsEmail({}, { message: i18nValidationMessage('error.INVALID_EMAIL') })
  @Transform(({ value }) => value.trim())
  @Length(6, 80)
  email: string;
}
