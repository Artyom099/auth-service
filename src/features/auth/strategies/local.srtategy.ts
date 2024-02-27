import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ValidateUserCommand } from '../application/auth/validate.user.use.case';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private commandBus: CommandBus) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<boolean> {
    const validateResult = await this.commandBus.execute(
      new ValidateUserCommand(email, password),
    );

    if (validateResult.hasError()) throw new UnauthorizedException();

    return true;
  }
}
