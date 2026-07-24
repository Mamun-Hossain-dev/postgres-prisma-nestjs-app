import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PublicUser, Role, User } from '../users/interfaces/user.interface';
import type { UserRepository } from '../users/repositories/user.repository';
import { toPublicUser } from '../users/utils/public-user.util';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponse,
  AuthSessionResult,
  JwtPayload,
  SessionMetadata,
} from './interfaces/auth.interface';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthSessionService } from './auth-session.service';
import { USER_REPOSITORY } from '../users/constants/user.tokens';
import { UserEvents } from '../users/events/user.events';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authSessionService: AuthSessionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppException('Email already in use', {
        code: 'EMAIL_ALREADY_IN_USE',
        status: 409,
      });
    }

    const saltRounds = this.configService.getOrThrow<number>(
      'auth.bcryptSaltRounds',
    );
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    const user = await this.userRepository.create({
      ...dto,
      email,
      password: hashedPassword,
      role: Role.USER,
    });
    const publicUser = toPublicUser(user);

    this.eventEmitter.emit(UserEvents.CREATED, publicUser);

    return publicUser;
  }

  async login(
    dto: LoginDto,
    metadata: SessionMetadata,
  ): Promise<AuthSessionResult> {
    const user = await this.userRepository.findByEmail(
      this.normalizeEmail(dto.email),
    );

    if (!user) {
      throw new AppException('Invalid email or password', {
        code: 'INVALID_CREDENTIALS',
        status: 401,
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new AppException('Invalid email or password', {
        code: 'INVALID_CREDENTIALS',
        status: 401,
      });
    }

    if (user.isBlocked) {
      throw new AppException('User account is blocked', {
        code: 'USER_BLOCKED',
        status: 401,
      });
    }

    const session = await this.authSessionService.create(user.id, metadata);

    return {
      auth: await this.buildAuthResponse(user),
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  async refresh(
    refreshToken: string,
    metadata: SessionMetadata,
  ): Promise<AuthSessionResult> {
    const session = await this.authSessionService.rotate(
      refreshToken,
      metadata,
    );
    const user = await this.userRepository.findById(session.userId);

    if (!user || user.isBlocked) {
      await this.authSessionService.revoke(session.refreshToken);
      throw new AppException('Invalid or expired refresh token', {
        code: 'INVALID_REFRESH_TOKEN',
        status: 401,
      });
    }

    return {
      auth: await this.buildAuthResponse(user),
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.authSessionService.revoke(refreshToken);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const publicUser = toPublicUser(user);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: publicUser,
    };
  }
}
