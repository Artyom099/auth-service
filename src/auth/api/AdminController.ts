import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';

import { RoleQueryRepository } from '../repositories/role/RoleQueryRepository';
import { RoleOutputModel } from './models/output/RoleOutputModel';
import { AccessObjectNodeOutputModel } from './models/output/AccessObjectTreeOutputModel';
import { AccessObjectQueryRepository } from '../repositories/access-object/AccessObjectQueryRepository';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private roleQueryRepository: RoleQueryRepository,
    private manager: EntityManager,
    private readonly accessObjectQueryRepository: AccessObjectQueryRepository,
  ) {}

  @ApiOperation({ summary: 'Получить список ролей' })
  @ApiResponse({
    status: 200,
    description: 'Список ролей успешно получен',
    type: [RoleOutputModel],
  })
  @Get('roles')
  async getRoles(): Promise<RoleOutputModel[]> {
    return this.roleQueryRepository.getRoles();
  }

  @Get('access_object/tree')
  @ApiOperation({ summary: 'Get access object tree' })
  @ApiResponse({
    status: 200,
    description: 'Returns tree of access objects with their actions',
    type: [AccessObjectNodeOutputModel],
  })
  async getAccessObjectTree(): Promise<AccessObjectNodeOutputModel[]> {
    return this.accessObjectQueryRepository.getAccessObjectTree();
  }
}
