import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { Right, Role } from '../../../../libs/db/entity';
import { RightReassignRequestDto, RightReassignResponseDto } from '../../../../libs/dto';

export class ReassignRightsCommand {
  constructor(public dto: RightReassignRequestDto) {}
}

@CommandHandler(ReassignRightsCommand)
export class ReassignRightsUseCase implements ICommandHandler<ReassignRightsCommand> {
  constructor(private manager: EntityManager) {}

  async execute(command: ReassignRightsCommand): Promise<RightReassignResponseDto[]> {
    const { roleName, actionNames } = command.dto;

    return this.manager.transaction(async (em) => {
      const role = await em.findOneBy(Role, { name: roleName });

      if (!role) {
        throw new BadRequestException(`role ${roleName} not found`);
      }

      const repository = em.getRepository(Right);
      const existRights = await repository.findBy({ roleName });

      if (existRights.length) {
        await repository.createQueryBuilder().delete().where(existRights).execute();
      }

      const newRights = actionNames.map((actionName) => ({ roleName, actionName }));
      const result = await repository.insert(newRights);

      return result.identifiers as RightReassignResponseDto[];
    });
  }
}
