import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserRepository } from '../users/repositories/user.repository';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findByEmail: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(10),
          },
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a signed JWT with the public user on successful login', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 1,
      name: 'Mamun',
      email: 'mamun@example.com',
      age: 24,
      password: await bcrypt.hash('secret123', 10),
    });

    await expect(
      service.login({
        email: 'mamun@example.com',
        password: 'secret123',
      }),
    ).resolves.toEqual({
      accessToken: 'signed-jwt-token',
      tokenType: 'Bearer',
      user: {
        id: 1,
        name: 'Mamun',
        email: 'mamun@example.com',
        age: 24,
      },
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'mamun@example.com',
    });
  });
});
