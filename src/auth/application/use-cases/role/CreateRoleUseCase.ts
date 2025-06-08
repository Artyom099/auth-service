import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { Role, RoleHierarchy } from '../../../../libs/db/entity';
import { RoleCreateRequestDto } from '../../../../libs/dto';

export class CreateRoleCommand {
  constructor(public dto: RoleCreateRequestDto) {}
}

@CommandHandler(CreateRoleCommand)
export class CreateRoleUseCase implements ICommandHandler<CreateRoleCommand> {
  constructor(private manager: EntityManager) {}

  async execute(command: CreateRoleCommand) {
    const { dto } = command;
    const { name, parentName } = dto;

    return this.manager.transaction(async (em) => {
      const isRoleExist = await em.exists(Role, { where: { name } });
      if (isRoleExist) {
        throw new BadRequestException(`role with name ${name} already exists`);
      }

      const isParentRoleExist = await em.exists(Role, { where: { name: parentName } });
      if (!isParentRoleExist) {
        throw new BadRequestException(`parent role with name ${parentName} does not exist`);
      }

      const isHierarchyExist = await em.exists(RoleHierarchy, { where: dto });
      if (!isHierarchyExist) {
        throw new BadRequestException(`hierarchy with name ${name} and parent name ${parentName} already exists`);
      }

      await em.save(em.create(Role, { name: dto.name, description: dto.description }));
      await em.save(em.create(RoleHierarchy, { name: dto.name, parentName: dto.parentName }));
    });
  }
}
