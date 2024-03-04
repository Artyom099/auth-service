import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { isAfter } from 'date-fns';
import { AuthRepository } from '../../features/auth/infrastructure/auth.repository';

@ValidatorConstraint({ async: true })
@Injectable()
export class ValidConfirmOrRecoveryCodeValidator
  implements ValidatorConstraintInterface
{
  constructor(private authRepository: AuthRepository) {}

  async validate(code: string): Promise<boolean> {
    try {
      const confirmCodeResult =
        await this.authRepository.getConfirmationData(code);
      const recoveryCodeResult =
        await this.authRepository.getRecoveryData(code);

      if (
        (confirmCodeResult.hasError() ||
          confirmCodeResult.payload?.isConfirmed) &&
        (recoveryCodeResult.hasError() ||
          isAfter(new Date(), recoveryCodeResult.payload.expirationDate))
      )
        return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Confirmation or Recovery code should be exist and actually';
  }
}

export function ValidCode(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'IsValidConfirmationCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidConfirmOrRecoveryCodeValidator,
    });
  };
}
