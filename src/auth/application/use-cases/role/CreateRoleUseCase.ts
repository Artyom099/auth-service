import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { Role } from '../../../../libs/db/entity';
import { RoleCreateRequestDto } from '../../../../libs/dto';

export class CreateRoleCommand {
  constructor(public dto: RoleCreateRequestDto) {}
}

@CommandHandler(CreateRoleCommand)
export class CreateRoleUseCase implements ICommandHandler<CreateRoleCommand> {
  constructor(private manager: EntityManager) {}

  async execute(command: CreateRoleCommand) {
    const { dto } = command;
    const { name } = dto;

    return this.manager.transaction(async (em) => {
      const role = await em.exists(Role, { where: { name } });

      if (role) {
        throw new BadRequestException(`role with name ${name} already exists`);
      }

      return em.save(em.create(Role, dto));
    });
  }
}
