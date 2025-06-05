import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { CreateSeedingCommand } from '../application';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private commandBus: CommandBus) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async startPage() {
    return {
      message: 'Эта апи будет перебрасывать пользователя на страницу авторизации',
    };
  }

  @Post('seeding') // системная апи для наката сидинга в бд
  @HttpCode(HttpStatus.CREATED)
  async seeding(@Body() body: { action: 'up' | 'down' }): Promise<string> {
    return this.commandBus.execute(new CreateSeedingCommand(body));
  }
}
