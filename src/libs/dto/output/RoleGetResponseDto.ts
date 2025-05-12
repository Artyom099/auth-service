import { ApiProperty } from '@nestjs/swagger';

export class RoleGetResponseDto {
  @ApiProperty({
    description: 'Название роли',
    example: 'admin',
  })
  name: string;

  @ApiProperty({
    description: 'Описание роли',
    example: 'Администратор системы',
  })
  description: string;
}
