import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessObject } from '../../libs/db/entity';
import {
  AccessObjectCalculateRightsRequestDto,
  RightReassignRequestDto,
  RightReassignResponseDto,
  RoleCreateRequestDto,
  RoleGetResponseDto,
  RoleGetTreeRequestDto,
  RoleGetTreeResponseDto,
  UserRoleCreateDto,
} from '../../libs/dto';
import { TNestedTreeItem } from '../../libs/utils';
import { CreateRoleCommand, CreateSeedingCommand, CreateUserRoleCommand, ReassignRightsCommand } from '../application';
import { AccessObjectQueryRepository, RoleQueryRepository } from '../repositories';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private commandBus: CommandBus,
    private readonly roleQueryRepository: RoleQueryRepository,
    private readonly accessObjectQueryRepository: AccessObjectQueryRepository,
  ) {}

  @Post('seeding') // системная апи для наката сидинга в бд
  async seeding(@Body() body: { action: 'up' | 'down' }): Promise<string> {
    return this.commandBus.execute(new CreateSeedingCommand(body));
  }

  @ApiOperation({ summary: 'Получить список ролей' })
  @ApiResponse({
    status: 200,
    description: 'Список ролей успешно получен',
  })
  @Get('roles')
  @HttpCode(200)
  async getRoles(): Promise<RoleGetResponseDto[]> {
    return this.roleQueryRepository.getRoles();
  }

  @Post('roles/get_tree')
  @HttpCode(200)
  async getRolesTree(@Body() body: RoleGetTreeRequestDto): Promise<RoleGetTreeResponseDto[]> {
    return this.roleQueryRepository.getRolesTree(body);
  }

  @Post('role')
  @HttpCode(201)
  async createRole(@Body() body: RoleCreateRequestDto) {
    return this.commandBus.execute(new CreateRoleCommand(body));
  }

  // todo - прикрутить к фронту
  @Post('user_role/create')
  @HttpCode(201)
  createUserRole(@Body() body: UserRoleCreateDto) {
    return this.commandBus.execute(new CreateUserRoleCommand(body));
  }

  @Get('access_object')
  @HttpCode(200)
  async getAccessObjects(): Promise<AccessObject[]> {
    return this.accessObjectQueryRepository.getAccessObjects();
  }

  @ApiResponse({
    status: 200,
    description: 'Дерево объектов доступа со списком бизнес-действий каждого объекта',
  })
  @HttpCode(200)
  @Post('access_object/calculate_rights')
  calculateRightTree(@Body() dto: AccessObjectCalculateRightsRequestDto): Promise<TNestedTreeItem[]> {
    return this.accessObjectQueryRepository.calculateRightTree(dto);
  }

  @ApiResponse({
    status: 200,
    description: 'Выдача/отзыв права роли на бизнес-действие',
  })
  @Post('right/reassign')
  async reassignRights(@Body() dto: RightReassignRequestDto): Promise<RightReassignResponseDto[]> {
    return this.commandBus.execute(new ReassignRightsCommand(dto));
  }
}
