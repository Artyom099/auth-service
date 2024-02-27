import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { AuthRepository } from '../../features/auth/infrastructure/auth.repository';

@Injectable()
export class ValidRecoveryCodePipe implements PipeTransform {
  constructor(private authRepository: AuthRepository) {}

  async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
    try {
      const recoveryDataResult =
        await this.authRepository.getRecoveryData(value);

      if (
        recoveryDataResult.hasError() ||
        recoveryDataResult.payload?.isConfirmed
      )
        throw new BadRequestException();

      return value;
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
