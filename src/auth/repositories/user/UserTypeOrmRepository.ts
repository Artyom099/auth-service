import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { User } from '../../../libs/db/entity/User';
import { UserEmailConfirmation } from '../../../libs/db/entity/UserEmailConfirmation';
import { OauthServicesTypesEnum } from '../../enums/oauth.services.types.enum';


@Injectable()
export class UserTypeOrmRepository {
    constructor() { }

    async getByProvider(
        em: EntityManager,
        provider: OauthServicesTypesEnum,
        id: number | string,
    ): Promise<User> {
        return em.findOne(User, {
            where: { [provider]: { id } },
            relations: [provider],
        });
    }

    async getUser<T extends object>(
        em: EntityManager,
        params: Partial<User>,
        additionalFields?: string[],
    ): Promise<User> {
        return em.findOne(User, {
            where: params,
            relations: additionalFields,
        });
    }

    async isUserExistByLoginOrEmail(
        em: EntityManager,
        loginOrEmail: string,
    ): Promise<boolean> {
        const qb = em.createQueryBuilder(User, 'u')
            .innerJoin(UserEmailConfirmation, 'eci', 'eci.userId = u.id')
            .where('u.login = :loginOrEmail')
            .orWhere('eci.email = :loginOrEmail')
            .setParameters({ loginOrEmail })

        return qb.getExists();
    }

    async getUserByLoginOrEmail(
        em: EntityManager,
        loginOrEmail: string,
    ): Promise<{ id: string, email: string }> {
        const qb = em.createQueryBuilder(User, 'u')
            .select('u.id', 'id')
            .addSelect('eci.email', 'email')
            .innerJoin(UserEmailConfirmation, 'eci', 'eci.userId = u.id')
            .where('u.login = :loginOrEmail')
            .orWhere('eci.email = :loginOrEmail')
            .setParameters({ loginOrEmail })

        return qb.getRawOne<{ id: string, email: string }>();
    }

    async create(em: EntityManager, dto: Partial<User>): Promise<string> {
        const user = await em.save<User>(em.create(User, dto));

        return user.id;
    }

    async delete(em: EntityManager, id: string): Promise<void> {
        await em.delete(User, id);
    }

    // async update(
    //     em: EntityManager,
    //     id: string,
    //     dto: { email: string, isEmailConfirmed: boolean },
    // ): Promise<void> {
    //     await em.update(User, id, dto);
    // }
}