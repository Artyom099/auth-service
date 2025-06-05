import { Body, Controller, Delete, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
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
  @Delete('delete_other')
  @HttpCode(HttpStatus.OK)
  async deleteOtherDevices(@CurrentUserId() userId: string, @RefreshToken() token: string) {
    return this.commandBus.execute(new DeleteOtherDevicesCommand(userId, token));
  }

  @DeleteDeviceApi()
  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(@CurrentUserId() userId: string, @Body() body: { id: string }) {
    return this.commandBus.execute(new DeleteDeviceCommand(body.id, userId));
  }
}
