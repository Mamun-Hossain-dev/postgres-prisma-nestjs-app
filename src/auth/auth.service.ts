import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PublicUser, User } from '../users/interfaces/user.interface';
import { UserRepository } from '../users/repositories/user.repository';
import { toPublicUser } from '../users/utils/public-user.util';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, JwtPayload } from './interfaces/auth.interface';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

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
      password: hashedPassword,
    });

    return toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

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

    return this.buildAuthResponse(user);
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
