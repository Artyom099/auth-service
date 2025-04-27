import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityManager } from 'typeorm';

import { ResultType, SuccessResult } from '../../../../libs/error-handling/result';
import { DeviceRepository } from '../../../repositories';
import { TokenService } from '../../services';

export class DeleteOtherDevicesCommand {
  constructor(
    public userId: string,
    public token: string,
  ) {}
}

@CommandHandler(DeleteOtherDevicesCommand)
export class DeleteOtherDevicesUseCase implements ICommandHandler<DeleteOtherDevicesCommand> {
  constructor(
    private manager: EntityManager,
    private tokenService: TokenService,
    private deviceRepository: DeviceRepository,
  ) {}

  async execute(command: DeleteOtherDevicesCommand): Promise<ResultType<{ deletedCount: number }>> {
    const { userId, token } = command;

    return this.manager.transaction(async (em) => {
      const payload = await this.tokenService.verifyRefreshToken(token);
      /**
       * todo
       * В токене почему-то всегда лежит такой deviceId, из-за этого удаление не работает
       * deviceId: 'f4acbc10-369d-46f2-b9c8-224cd5dc86a5',
       */
      console.log({ payload });

      const deletedCount = await this.deviceRepository.deleteOtherDevices(em, payload.deviceId, userId);

      return new SuccessResult(deletedCount);
    });
  }
}
