import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserRepository } from '../../users/repositories/user.repository';
import { Role } from '../../users/interfaces/user.interface';

describe('JwtStrategy', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
  } as unknown as ConfigService;
  const userRepository = {
    findById: jest.fn(),
  } as unknown as UserRepository;
  const strategy = new JwtStrategy(configService, userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an existing token when its user has been blocked', async () => {
    jest.spyOn(userRepository, 'findById').mockResolvedValue({
      id: 1,
      name: 'Blocked User',
      email: 'blocked@example.com',
      age: 24,
      password: 'hashed-password',
      role: Role.USER,
      isBlocked: true,
    });

    await expect(
      strategy.validate({ sub: 1, email: 'blocked@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
