import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { Role, User } from './interfaces/user.interface';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    setBlocked: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue(null),
      setBlocked: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([Role.USER, Role.SELLER])('blocks a %s account', async (role) => {
    const user: User = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      age: 20,
      password: 'hashed-password',
      role,
      isBlocked: false,
    };
    userRepository.findById.mockResolvedValue(user);
    userRepository.setBlocked.mockResolvedValue({
      ...user,
      isBlocked: true,
    });

    await expect(service.setUserBlocked(1, true)).resolves.toMatchObject({
      id: 1,
      role,
      isBlocked: true,
    });
    expect(userRepository.setBlocked).toHaveBeenCalledWith(1, true);
  });

  it('does not allow an admin account to be blocked', async () => {
    userRepository.findById.mockResolvedValue({
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      age: 30,
      password: 'hashed-password',
      role: Role.ADMIN,
      isBlocked: false,
    });

    await expect(service.setUserBlocked(1, true)).rejects.toMatchObject({
      code: 'ADMIN_BLOCK_FORBIDDEN',
    });
    expect(userRepository.setBlocked).not.toHaveBeenCalled();
  });
});
