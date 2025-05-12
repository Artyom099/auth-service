import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class EmailInputModel {
  @ApiProperty({
    minimum: 6,
    maximum: 80,
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.trim())
  @Length(6, 80)
  email: string;
}
