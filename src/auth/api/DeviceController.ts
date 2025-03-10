import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../libs';
import { DeviceQueryRepository } from '../repositories';
import { RefreshToken } from '../../libs';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteOtherDevicesCommand } from '../application';
import { DeleteDeviceCommand } from '../application';
import { AuthGuard } from '../guard/auth.guard';
import {
  GetDevicesApi,
  DeleteDeviceApi,
  DeleteOtherDevicesApi,
} from '../../libs/swagger/decorators';

@ApiTags('Device')
@Controller('device')
@UseGuards(AuthGuard)
export class DeviceController {
  constructor(
    private commandBus: CommandBus,
    private deviceQueryRepository: DeviceQueryRepository,
  ) {}

  @GetDevicesApi()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getDevices(@CurrentUserId() userId: number) {
    return this.deviceQueryRepository.getDevices(userId);
  }

  @DeleteOtherDevicesApi()
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOtherDevices(
    @CurrentUserId() userId: number,
    @RefreshToken() token: string,
  ) {
    return this.commandBus.execute(
      new DeleteOtherDevicesCommand(userId, token),
    );
  }

  @DeleteDeviceApi()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(@Param('id') id: string, @CurrentUserId() userId: number) {
    return this.commandBus.execute(new DeleteDeviceCommand(id, userId));
  }
}
