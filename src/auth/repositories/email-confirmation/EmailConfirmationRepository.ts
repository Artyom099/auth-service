import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UserEmailConfirmation } from '../../../libs/db/entity';
import { UpdateCodeDTO } from '../../api/models/dto/update.code.dto';

@Injectable()
export class EmailConfirmationRepository {
  constructor() {}

  async confirmEmail(em: EntityManager, userId: string): Promise<void> {
    await em.update(UserEmailConfirmation, { userId }, { isConfirmed: true });
  }

  async create(em: EntityManager, dto: { expirationDate: Date; email: string; userId: string }) {
    return em.save(em.create(UserEmailConfirmation, dto));
  }

  async getConfirmationDataByCode(em: EntityManager, code: string): Promise<UserEmailConfirmation> {
    return em.findOneBy(UserEmailConfirmation, { confirmationCode: code });
  }

  async getConfirmationDataByEmail(em: EntityManager, email: string): Promise<UserEmailConfirmation> {
    return em.findOneBy(UserEmailConfirmation, { email });
  }

  async updateConfirmationData(em: EntityManager, dto: UpdateCodeDTO): Promise<string> {
    const { userId, expirationDate, confirmationCode } = dto;

    const updateResult = await em.update(UserEmailConfirmation, { userId }, { expirationDate, confirmationCode });
    console.log({ updateResult });

    return confirmationCode;
  }
}
