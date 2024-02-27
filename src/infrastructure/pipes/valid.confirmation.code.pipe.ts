import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { AuthRepository } from '../../features/auth/infrastructure/auth.repository';

@Injectable()
export class ValidConfirmationCodePipe implements PipeTransform {
  constructor(private authRepository: AuthRepository) {}

  async transform(value: string, metadata: ArgumentMetadata): Promise<string> {
    try {
      const confirmDataResult =
        await this.authRepository.getConfirmationData(value);

      if (
        confirmDataResult.hasError() ||
        confirmDataResult.payload?.isConfirmed
      )
        throw new BadRequestException();

      return value;
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
