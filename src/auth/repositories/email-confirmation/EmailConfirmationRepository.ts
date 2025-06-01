import { DeepPartial, EntityManager } from 'typeorm';

import { UserEmailConfirmation } from '../../../libs/db/entity';
import { UpdateCodeDto } from '../../../libs/dto/UpdateCodeDto';

export class EmailConfirmationRepository {
  async confirmEmail(em: EntityManager, userId: string): Promise<void> {
    await em.update(UserEmailConfirmation, { userId }, { isConfirmed: true });
  }

  async create(em: EntityManager, dto: DeepPartial<UserEmailConfirmation>) {
    return em.save(em.create(UserEmailConfirmation, dto));
  }

  async getByCode(em: EntityManager, code: string): Promise<UserEmailConfirmation> {
    return em.findOneBy(UserEmailConfirmation, { confirmationCode: code });
  }

  async getByEmail(em: EntityManager, email: string): Promise<UserEmailConfirmation> {
    return em.findOneBy(UserEmailConfirmation, { email });
  }

  async updateConfirmationData(em: EntityManager, dto: UpdateCodeDto): Promise<string> {
    const { userId, expirationDate, confirmationCode } = dto;

    const updateResult = await em.update(UserEmailConfirmation, { userId }, { expirationDate, confirmationCode });
    console.log({ updateResult });

    return confirmationCode;
  }

  async delete(em: EntityManager, userId: string): Promise<void> {
    await em.delete(UserEmailConfirmation, { userId });
  }
}
