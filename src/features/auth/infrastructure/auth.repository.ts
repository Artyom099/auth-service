import {
  Prisma,
  User,
  UserEmailConfirmation,
  UserPasswordRecovery,
} from '@prisma/client';
import { UpdateCodeDTO } from '../api/models/dto/update.code.dto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Contract } from '../../../infrastructure/contract/contract';
import { InternalCode } from '../../../infrastructure/utils/enums';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  // user

  async createUser(
    data: Prisma.UserCreateInput,
    expirationDate: Date,
  ): Promise<Contract<{ userId: number; code: string }>> {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        emailConfirmationInfo: {
          create: { expirationDate },
        },
      },
      select: {
        id: true,
        emailConfirmationInfo: { select: { confirmationCode: true } },
      },
    });

    if (!user) return new Contract(InternalCode.DbError);

    return new Contract(InternalCode.Success, {
      userId: user.id,
      code: user.emailConfirmationInfo.confirmationCode,
    });
  }

  async deleteUser(userId: number): Promise<Contract<null>> {
    const deleteResult = await this.prisma.user.delete({
      where: { id: userId },
    });

    if (!deleteResult) return new Contract(InternalCode.DbError);

    return new Contract(InternalCode.Success);
  }

  async getUserByCredentials(loginOrEmail: string): Promise<Contract<User>> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ login: loginOrEmail }, { email: loginOrEmail }],
      },
    });

    if (!user) return new Contract(InternalCode.NotFound);

    return new Contract(InternalCode.Success, user);
  }

  async getUserByConfirmationCode(code: string): Promise<Contract<User>> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailConfirmationInfo: {
          confirmationCode: code,
        },
      },
    });

    if (!user) return new Contract(InternalCode.NotFound);

    return new Contract(InternalCode.Success, user);
  }

  // email confirmation

  async confirmEmail(userId: number): Promise<Contract<null>> {
    const confirmation = await this.prisma.userEmailConfirmation.update({
      where: { userId },
      data: { isConfirmed: true },
    });

    if (!confirmation) return new Contract(InternalCode.DbError);

    return new Contract(InternalCode.Success);
  }

  async getConfirmationData(
    code: string,
  ): Promise<Contract<UserEmailConfirmation>> {
    const confirmationData = await this.prisma.userEmailConfirmation.findFirst({
      where: { confirmationCode: code },
    });

    if (!confirmationData) return new Contract(InternalCode.NotFound);

    return new Contract(InternalCode.Success, confirmationData);
  }

  async updateConfirmationData(
    data: UpdateCodeDTO,
  ): Promise<Contract<{ code: string }>> {
    const { userId, expirationDate, code } = data;

    const confirmationData = await this.prisma.userEmailConfirmation.update({
      where: { userId },
      data: {
        expirationDate,
        confirmationCode: code,
      },
    });

    if (!confirmationData) return new Contract(InternalCode.DbError);

    return new Contract(InternalCode.Success, {
      code: confirmationData.confirmationCode,
    });
  }

  // password recovery

  async getRecoveryData(code: string): Promise<Contract<UserPasswordRecovery>> {
    const recoveryData = await this.prisma.userPasswordRecovery.findFirst({
      where: { recoveryCode: code },
    });

    if (!recoveryData) return new Contract(InternalCode.NotFound);

    return new Contract(InternalCode.Success, recoveryData);
  }

  async updatePassword(
    userId: number,
    passwordHash: string,
  ): Promise<Contract<null>> {
    const password = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    if (!password) return new Contract(InternalCode.DbError);

    return new Contract(InternalCode.Success);
  }

  async upsertRecoveryData(
    data: UpdateCodeDTO,
  ): Promise<Contract<UserPasswordRecovery>> {
    const { userId, expirationDate, code } = data;

    const recoveryData = await this.prisma.userPasswordRecovery.upsert({
      where: { userId },
      update: { expirationDate, recoveryCode: code },
      create: { expirationDate, userId },
    });

    if (!recoveryData) return new Contract(InternalCode.DbError);

    return new Contract(InternalCode.Success, recoveryData);
  }

  async confirmRecoveryPassword(
    userId: number,
  ): Promise<Contract<{ code: string }>> {
    const recoveryData = await this.prisma.userPasswordRecovery.update({
      where: { userId },
      data: { isConfirmed: true },
      select: { recoveryCode: true },
    });

    if (!recoveryData) return new Contract(InternalCode.DbError);

    return new Contract(InternalCode.Success, {
      code: recoveryData.recoveryCode,
    });
  }
}
