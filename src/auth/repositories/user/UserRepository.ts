import { DeepPartial, EntityManager } from 'typeorm';

import { User, UserEmailConfirmation, YandexUser } from '../../../libs/db/entity';
import { OauthServicesTypesEnum } from '../../../libs/enums/OauthServicesTypesEnum';

export class UserRepository {
  async getByProvider(em: EntityManager, provider: OauthServicesTypesEnum, id: number | string): Promise<User> {
    return em.findOne(User, {
      where: { [provider]: { id } },
      relations: [provider],
    });
  }

  async getUser(
    em: EntityManager,
    params: any, // @todo - Partial<User>,
    additionalFields?: any, // @todo - string[],
  ): Promise<User> {
    return em.findOne(User, {
      where: params,
      relations: additionalFields,
    });
  }

  async isUserExistByLoginOrEmail(em: EntityManager, loginOrEmail: string): Promise<boolean> {
    const qb = em
      .createQueryBuilder(User, 'u')
      .innerJoin(UserEmailConfirmation, 'eci', 'eci.userId = u.id')
      .where('u.login = :loginOrEmail')
      .orWhere('eci.email = :loginOrEmail')
      .setParameters({ loginOrEmail });

    return qb.getExists();
  }

  async getUserByLoginOrEmail(
    em: EntityManager,
    loginOrEmail: string,
  ): Promise<{ id: string; email: string; isConfirmed: boolean; passwordHash: string }> {
    const qb = em
      .createQueryBuilder(User, 'u')
      .select('u.id', 'id')
      .addSelect('uec.email', 'email')
      .addSelect('uec.isConfirmed', 'isConfirmed')
      .addSelect('u.passwordHash', 'passwordHash')
      .innerJoin(UserEmailConfirmation, 'uec', 'uec.userId = u.id')
      .where('u.login = :loginOrEmail')
      .orWhere('uec.email = :loginOrEmail')
      .setParameters({ loginOrEmail });

    return qb.getRawOne<{ id: string; email: string; isConfirmed: boolean; passwordHash: string }>();
  }

  async create(em: EntityManager, dto: DeepPartial<User>): Promise<User> {
    return em.save<User>(em.create(User, dto));
  }

  async delete(em: EntityManager, id: string): Promise<void> {
    await em.delete(User, id);
  }

  async connectProviderToUser(
    em: EntityManager,
    id: string,
    dto: any, // @todo - fix type
  ): Promise<void> {
    await em.update(User, id, dto);
  }

  /**
   * поиск пользователя зарегистрированного через yandex по email
   */
  public async getUserCreatedByYandex(
    em: EntityManager,
    email: string,
  ): Promise<{
    id: string;
    email: string;
  }> {
    const qb = em
      .createQueryBuilder(User, 'u')
      .select('u.id', 'id')
      .addSelect('uec.email', 'email')
      .innerJoin(YandexUser, 'yu', 'yu.userId = u.id')
      .innerJoin(UserEmailConfirmation, 'uec', 'uec.userId = u.id')
      .where('uec.email = :email', { email });

    return qb.getRawOne<{ id: string; email: string }>();
  }

  /**
   * создание пользователя через яндекс
   */
  public async createYandexUser(em: EntityManager, dto: DeepPartial<YandexUser>): Promise<void> {
    await em.save(
      em.create(YandexUser, {
        yandexId: dto.yandexId,
        userId: dto.userId,
      }),
    );
  }

  /**
   * Проверяем, не зарегистрирован ли уже пользователь с таким email
   */
  public async getExistingYandexUser(em: EntityManager, email: string): Promise<{ id: string; email: string }> {
    const qb = em
      .createQueryBuilder(User, 'u')
      .select('u.id', 'id')
      .addSelect('uec.email', 'email')
      .innerJoin(UserEmailConfirmation, 'uec', 'uec.userId = u.id')
      .where('uec.email = :email', { email });

    return qb.getRawOne<{ id: string; email: string }>();
  }
}
