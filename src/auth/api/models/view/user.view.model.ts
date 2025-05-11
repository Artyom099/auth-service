import { ApiProperty } from '@nestjs/swagger';

export class UserViewModel {
  @ApiProperty()
  login: string;

  // @ApiProperty()
  // email: string;

  @ApiProperty()
  userId: string;
}
