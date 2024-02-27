import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordRecoveryInputModel {
  @ApiProperty({
    minimum: 6,
    maximum: 100,
    pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$\n',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @Matches('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')
  email: string;
}
