import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { UserRepository } from '../../users/repositories/user.repository';
import { toPublicUser } from '../../users/utils/public-user.util';
import { JwtPayload } from '../interfaces/auth.interface';
import { USER_REPOSITORY } from '../../users/constants/user.tokens';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('User account is blocked');
    }

    return toPublicUser(user);
  }
}
