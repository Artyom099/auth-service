import { ApiProperty } from '@nestjs/swagger';

export class ActionOutputModel {
  @ApiProperty({
    description: 'Название действия',
    example: 'create',
  })
  name: string;

  @ApiProperty({
    description: 'Тип действия',
    example: 'write',
  })
  type: string;
}

export class AccessObjectNodeOutputModel {
  @ApiProperty({
    description: 'Название объекта доступа',
    example: 'users',
  })
  name: string;

  @ApiProperty({
    description: 'Тип объекта доступа',
    example: 'module',
  })
  type: string;

  @ApiProperty({
    description: 'Список действий',
    type: [ActionOutputModel],
  })
  actions: ActionOutputModel[];

  @ApiProperty({
    description: 'Дочерние объекты',
    type: [AccessObjectNodeOutputModel],
    nullable: true,
  })
  children?: AccessObjectNodeOutputModel[];
} 