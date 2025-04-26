import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Start')
@Controller()
export class StartController {
  @Get('/.')
  @HttpCode(HttpStatus.OK)
  async startButton() {
    return {
      message: 'Эта апи будет перебрасывать пользователя на страницу авторизации',
    };
  }
}
