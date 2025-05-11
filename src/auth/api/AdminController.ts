import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';

import { RoleQueryRepository } from '../repositories/role/RoleQueryRepository';
import { RoleOutputModel } from './models/output/RoleOutputModel';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private roleQueryRepository: RoleQueryRepository,
    private manager: EntityManager,
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
}
