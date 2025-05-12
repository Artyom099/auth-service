import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessObjectNodeResponseDto } from '../../libs/dto/output/AccessObjectNodeResponseDto';
import { RoleGetResponseDto } from '../../libs/dto/output/RoleGetResponseDto';
import { RoleQueryRepository } from '../repositories';
import { AccessObjectQueryRepository } from '../repositories/access-object/AccessObjectQueryRepository';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private roleQueryRepository: RoleQueryRepository,
    private readonly accessObjectQueryRepository: AccessObjectQueryRepository,
  ) {}

  @ApiOperation({ summary: 'Получить список ролей' })
  @ApiResponse({
    status: 200,
    description: 'Список ролей успешно получен',
    type: [RoleGetResponseDto],
  })
  @Get('roles')
  async getRoles(): Promise<RoleGetResponseDto[]> {
    return this.roleQueryRepository.getRoles();
  }

  @Get('access_object/tree')
  @ApiOperation({ summary: 'Get access object tree' })
  @ApiResponse({
    status: 200,
    description: 'Returns tree of access objects with their actions',
    type: [AccessObjectNodeResponseDto],
  })
  async getAccessObjectTree(): Promise<AccessObjectNodeResponseDto[]> {
    return this.accessObjectQueryRepository.getAccessObjectTree();
  }
}
