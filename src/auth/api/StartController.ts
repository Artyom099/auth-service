import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Start')
@Controller('start')
export class StartController {
  @Get()
  @HttpCode(HttpStatus.OK)
  async startPage() {
    return {
      message: 'Эта апи будет перебрасывать пользователя на страницу авторизации',
    };
  }
}
