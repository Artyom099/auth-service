import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from '../../libs';
import { RefreshToken } from '../../libs';
import { DeleteDeviceApi, DeleteOtherDevicesApi, GetDevicesApi } from '../../libs/swagger/decorators';
import { DeleteOtherDevicesCommand } from '../application';
import { DeleteDeviceCommand } from '../application';
import { AuthGuard } from '../guard/AuthGuard';
import { DeviceQueryRepository } from '../repositories';

@ApiTags('Device')
@Controller('device')
@UseGuards(AuthGuard)
export class DeviceController {
  constructor(
    private commandBus: CommandBus,
    private deviceQueryRepository: DeviceQueryRepository,
  ) { }

  @GetDevicesApi()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getDevices(@CurrentUserId() userId: number) {
    return this.deviceQueryRepository.getDevices(userId);
  }

  @DeleteOtherDevicesApi()
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOtherDevices(@CurrentUserId() userId: number, @RefreshToken() token: string) {
    return this.commandBus.execute(new DeleteOtherDevicesCommand(userId, token));
  }

  @DeleteDeviceApi()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(@Param('id') id: string, @CurrentUserId() userId: number) {
    return this.commandBus.execute(new DeleteDeviceCommand(id, userId));
  }
}
