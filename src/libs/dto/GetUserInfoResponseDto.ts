import { ApiProperty } from '@nestjs/swagger';

export class GetUserInfoResponseDto {
  @ApiProperty()
  login: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  userId: string;
}
