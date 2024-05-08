import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, Length } from 'class-validator';

export class UpdatePasswordInputModel {
  @ApiProperty({
    minimum: 8,
    maximum: 20,
    description:
      'password should contain at least one capital letter, one number & one symbol',
  })
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @Length(8, 20)
  newPassword: string;
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  // @ValidCode()
  recoveryCode: string;
}
