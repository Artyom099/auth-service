import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class UpdatePasswordInputModel {
  @ApiProperty({
    minimum: 6,
    maximum: 20,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*[!"#$%&\'()*+,\\-.:;<=>?@[\\\\\\]^_`{|}~]).*$',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @Length(6, 20)
  @Matches(
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*[!"#$%&\'()*+,\\-.:;<=>?@[\\\\\\]^_`{|}~]).*$',
  )
  newPassword: string;
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.trim())
  // @IsValidCode()
  recoveryCode: string;
}
