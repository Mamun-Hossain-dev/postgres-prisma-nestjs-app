import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { Role, User } from './interfaces/user.interface';
import { ConfigService } from '@nestjs/config';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.MockedFunction<UserRepository['create']>;
    update: jest.Mock;
    setBlocked: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn<UserRepository['create']>(),
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
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(10),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes passwords and normalizes email for admin-created users', async () => {
    userRepository.create.mockImplementation((data: object) =>
      Promise.resolve({ id: 1, age: 0, isBlocked: false, ...data }),
    );

    await service.createUser({
      name: 'Seller',
      email: ' SELLER@Example.COM ',
      password: 'secret123',
      role: Role.SELLER,
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'seller@example.com',
      }),
    );
    expect(userRepository.create.mock.calls[0][0].password).toMatch(
      /^\$2[aby]\$/,
    );
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
