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
  UserGetListResponseDto,
  UserGetRolesRequestDto,
  UserGetRolesResponseDto,
  UserRoleCreateDto,
} from '../../libs/dto';
import { TNestedTreeItem } from '../../libs/utils';
import { CreateRoleCommand, CreateUserRoleCommand, ReassignRightsCommand } from '../application';
import { AccessObjectQueryRepository, RoleQueryRepository, UserQueryRepository } from '../repositories';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private commandBus: CommandBus,
    private readonly roleQueryRepository: RoleQueryRepository,
    private readonly userQueryRepository: UserQueryRepository,
    private readonly accessObjectQueryRepository: AccessObjectQueryRepository,
  ) {}

  @ApiOperation({ summary: 'Получить список ролей' })
  @Get('roles')
  @HttpCode(200)
  async getRoles(): Promise<RoleGetResponseDto[]> {
    return this.roleQueryRepository.getRoles();
  }

  @Get('user/get_list')
  @HttpCode(200)
  async getUserList(): Promise<UserGetListResponseDto[]> {
    return this.userQueryRepository.getUserList();
  }

  @Post('user/get_roles')
  @HttpCode(200)
  async getUserRoles(@Body() body: UserGetRolesRequestDto): Promise<UserGetRolesResponseDto[]> {
    return this.userQueryRepository.getUserRoles(body);
  }

  @Post('roles/get_tree')
  @HttpCode(200)
  async getRolesTree(@Body() body: RoleGetTreeRequestDto): Promise<RoleGetTreeResponseDto[]> {
    return this.roleQueryRepository.getRolesTree(body);
  }

  @Post('role/create')
  @HttpCode(201)
  async createRole(@Body() body: RoleCreateRequestDto) {
    return this.commandBus.execute(new CreateRoleCommand(body));
  }

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
