import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { FillAccessTables1710000000000 } from '../../../libs/db/seeding';

export class CreateSeedingCommand {
  constructor(public dto: { action: 'up' | 'down' }) {}
}

@CommandHandler(CreateSeedingCommand)
export class CreateSeedingUseCase implements ICommandHandler<CreateSeedingCommand> {
  constructor(private manager: EntityManager) {}

  async execute(command: CreateSeedingCommand): Promise<string> {
    const { dto } = command;
    const { action } = dto;

    return this.manager.transaction(async (em) => {
      const seeding = new FillAccessTables1710000000000();

      try {
        await seeding[action](em.queryRunner);
      } catch (e) {
        return e;
      }

      return `seeding successfully ${action}`;
    });
  }
}
