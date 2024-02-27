import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class RegistrationInputModel {
  @ApiProperty({
    minimum: 6,
    maximum: 30,
    pattern: '^[a-zA-Z0-9_-]*$',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @Length(6, 30)
  login: string;
  @ApiProperty({
    minimum: 6,
    maximum: 100,
    pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$\n',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @Length(6, 100)
  @Matches('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')
  email: string;
  @ApiProperty({
    minimum: 6,
    maximum: 20,
    pattern:
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*[!"#$%&\'()*+,\\-.:;<=>?@[\\\\\\]^_`{|}~]).*$',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @Matches(
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*[!"#$%&\'()*+,\\-.:;<=>?@[\\\\\\]^_`{|}~]).*$',
  )
  @Length(6, 20)
  password: string;
}
