import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegistrationInputModel {
  @ApiProperty({
    minimum: 6,
    maximum: 30,
    description: 'login may contains lowercase letters, numbers, underscore',
  })
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  @Length(6, 30)
  login: string;
  @ApiProperty({
    minimum: 6,
    maximum: 80,
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.NOT_EMPTY', { args: 'email' }),
  })
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  @Length(6, 80)
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString()
  email: string;
  @ApiProperty({
    minimum: 8,
    maximum: 20,
    description:
      'password should contain at least one capital letter, one number & one symbol',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: i18nValidationMessage('validation.PASSWORD_WEAK') },
  )
  @IsString()
  @Transform(({ value }) => value.trim())
  @Length(8, 20)
  password: string;
}
