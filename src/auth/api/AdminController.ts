import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  RightReassignRequestDto,
  RightReassignResponseDto,
  RoleCreateRequestDto,
  RoleGetResponseDto,
} from '../../libs/dto';
import { AccessObjectNodeResponseDto } from '../../libs/dto/output/AccessObjectNodeResponseDto';
import { CreateRoleCommand, ReassignRightsCommand } from '../application';
import { AccessObjectQueryRepository, RoleQueryRepository } from '../repositories';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private commandBus: CommandBus,
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
  @HttpCode(200)
  async getRoles(): Promise<RoleGetResponseDto[]> {
    return this.roleQueryRepository.getRoles();
  }

  @Post('role')
  @HttpCode(201)
  async createRole(@Body() body: RoleCreateRequestDto) {
    return this.commandBus.execute(new CreateRoleCommand(body));
  }

  async getAccessObjects() {}

  @ApiOperation({ summary: 'Get access object tree' })
  @ApiResponse({
    status: 200,
    description: 'Дерево объектов доступа со списком бизнес-действий каждого объекта',
    type: [AccessObjectNodeResponseDto],
  })
  @Get('access_object/tree')
  @HttpCode(200)
  async getAccessObjectTree(): Promise<AccessObjectNodeResponseDto[]> {
    return this.accessObjectQueryRepository.getAccessObjectTree();
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
