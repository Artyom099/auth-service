import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { UserRole } from '../../../../libs/db/entity';
import { UserRoleCreateDto } from '../../../../libs/dto';

export class CreateUserRoleCommand {
  constructor(public dto: UserRoleCreateDto) {}
}

@CommandHandler(CreateUserRoleCommand)
export class CreateUserRoleUseCase implements ICommandHandler<CreateUserRoleCommand> {
  constructor(private manager: EntityManager) {}

  async execute(command: CreateUserRoleCommand) {
    const { dto } = command;

    return this.manager.transaction(async (em) => {
      const isUserRoleExists = await em.exists(UserRole, { where: dto });
      if (isUserRoleExists) {
        throw new BadRequestException(`User role ${dto} already exists`);
      }

      return em.save(em.create(UserRole, dto));
    });
  }
}
