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
import { CurrentUserId } from '../../decorators/current.user.id.decorator';
import { DeviceQueryRepository } from '../../repositories/device/device.query.repository';
import { RefreshToken } from '../../decorators/refresh.token.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteOtherDevicesCommand } from '../../application/use-cases/device/delete.other.devices.use.case';
import { DeleteDeviceCommand } from '../../application/use-cases/device/delete.device.use.case';
import { AuthGuard } from '../../guard/auth.guard';
import { GetDevicesEndpoint } from './swagger-docs/get.devices.endpoint';
import { DeleteDeviceEndpoint } from './swagger-docs/delete.device.endpoint';
import { DeleteOtherDevicesEndpoint } from './swagger-docs/delete.other.devices.endpoint';

@ApiTags('Device')
@Controller('device')
@UseGuards(AuthGuard)
export class DeviceController {
  constructor(
    private commandBus: CommandBus,
    private deviceQueryRepository: DeviceQueryRepository,
  ) {}

  @GetDevicesEndpoint()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getDevices(@CurrentUserId() userId: number) {
    return this.deviceQueryRepository.getDevices(userId);
  }

  @DeleteOtherDevicesEndpoint()
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

  @DeleteDeviceEndpoint()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevice(@Param('id') id: string, @CurrentUserId() userId: number) {
    return this.commandBus.execute(new DeleteDeviceCommand(id, userId));
  }
}
