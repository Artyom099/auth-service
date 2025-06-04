import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId, RefreshToken } from '../../libs/decorators';
import { DeleteDeviceApi, DeleteOtherDevicesApi, GetDevicesApi } from '../../libs/swagger';
import { DeleteDeviceCommand, DeleteOtherDevicesCommand } from '../application';
import { RolesGuard } from '../guard';
import { DeviceQueryRepository } from '../repositories';

@ApiTags('Device')
@Controller('device')
@UseGuards(RolesGuard)
export class DeviceController {
  constructor(
    private commandBus: CommandBus,
    private deviceQueryRepository: DeviceQueryRepository,
  ) {}

  @GetDevicesApi()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getDevices(@CurrentUserId() userId: string) {
    return this.deviceQueryRepository.getDevices(userId);
  }

  @DeleteOtherDevicesApi()
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteOtherDevices(@CurrentUserId() userId: string, @RefreshToken() token: string) {
    return this.commandBus.execute(new DeleteOtherDevicesCommand(userId, token));
  }

  @DeleteDeviceApi()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.commandBus.execute(new DeleteDeviceCommand(id, userId));
  }
}
