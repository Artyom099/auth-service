import { EntityManager } from 'typeorm';

import { User, UserPasswordRecovery } from '../../../libs/db/entity';
import { UpdateRecoveryCodeDto } from '../../api/models/dto/UpdateRecoveryCodeDto';

export class PasswordRecoveryRepository {
  async getRecoveryData(em: EntityManager, code: string): Promise<UserPasswordRecovery> {
    return em.findOneBy(UserPasswordRecovery, { recoveryCode: code });
  }

  async confirmRecoveryPassword(em: EntityManager, userId: string): Promise<void> {
    await em.update(UserPasswordRecovery, { userId }, { isConfirmed: true });
  }

  async upsertPasswordRecovery(em: EntityManager, dto: UpdateRecoveryCodeDto): Promise<{ recoveryCode: string }> {
    const { userId, expirationDate, recoveryCode } = dto;

    const passwordRecovery = await em.findOneBy(UserPasswordRecovery, { userId });

    if (passwordRecovery) {
      await em.update(UserPasswordRecovery, { userId }, { expirationDate, recoveryCode, isConfirmed: false });
    } else {
      await em.save(em.create(UserPasswordRecovery, dto));
    }

    return { recoveryCode };
  }

  async updatePassword(em: EntityManager, id: string, passwordHash: string): Promise<void> {
    await em.update(User, { id }, { passwordHash });
  }
}
