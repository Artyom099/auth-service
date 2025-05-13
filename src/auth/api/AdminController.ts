import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RightReassignRequestDto, RightReassignResponseDto } from '../../libs/dto';
import { AccessObjectNodeResponseDto } from '../../libs/dto/output/AccessObjectNodeResponseDto';
import { RoleGetResponseDto } from '../../libs/dto/output/RoleGetResponseDto';
import { ReassignRightsCommand } from '../application';
import { RoleQueryRepository } from '../repositories';
import { AccessObjectQueryRepository } from '../repositories/access-object/AccessObjectQueryRepository';

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
  async getRoles(): Promise<RoleGetResponseDto[]> {
    return this.roleQueryRepository.getRoles();
  }

  @ApiOperation({ summary: 'Get access object tree' })
  @ApiResponse({
    status: 200,
    description: 'Дерево объектов доступа со списком бизнес-действий каждого объекта',
    type: [AccessObjectNodeResponseDto],
  })
  @Get('access_object/tree')
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
