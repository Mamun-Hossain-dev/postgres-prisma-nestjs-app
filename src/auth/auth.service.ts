import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicUser } from '../users/interfaces/user.interface';
import { UserRepository } from '../users/repositories/user.repository';
import { toPublicUser } from '../users/utils/public-user.util';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
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

  async login(dto: LoginDto): Promise<PublicUser> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return toPublicUser(user);
  }
}
