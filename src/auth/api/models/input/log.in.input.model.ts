import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LogInInputModel {
  @ApiProperty({
    minimum: 6,
    maximum: 80,
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  @Transform(({ value }) => value.trim())
  email: string;

  @ApiProperty({
    minimum: 8,
    maximum: 20,
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsString()
  @Transform(({ value }) => value.trim())
  password: string;
}
