import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { Role, User } from './interfaces/user.interface';
import { ConfigService } from '@nestjs/config';
import { UploadsService } from '../uploads/uploads.service';
import { USER_REPOSITORY } from './constants/user.tokens';

describe('UserService', () => {
  let service: UserService;
  let userRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.MockedFunction<UserRepository['create']>;
    update: jest.Mock;
    setBlocked: jest.Mock;
    updateProfileImage: jest.Mock;
    delete: jest.Mock;
  };
  let uploadsService: {
    uploadImage: jest.Mock;
    deleteFile: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn<UserRepository['create']>(),
      update: jest.fn().mockResolvedValue(null),
      setBlocked: jest.fn().mockResolvedValue(null),
      updateProfileImage: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    uploadsService = {
      uploadImage: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(10),
          },
        },
        {
          provide: UploadsService,
          useValue: uploadsService,
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
      profileImageUrl: null,
      profileImagePublicId: null,
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
      profileImageUrl: null,
      profileImagePublicId: null,
    });

    await expect(service.setUserBlocked(1, true)).rejects.toMatchObject({
      code: 'ADMIN_BLOCK_FORBIDDEN',
    });
    expect(userRepository.setBlocked).not.toHaveBeenCalled();
  });

  it('replaces the current user profile image and removes the old file', async () => {
    const user: User = {
      id: 1,
      name: 'User',
      email: 'user@example.com',
      age: 20,
      password: 'hash',
      role: Role.USER,
      isBlocked: false,
      profileImageUrl: 'https://example.com/old.png',
      profileImagePublicId: 'users/old',
    };
    userRepository.findById.mockResolvedValue(user);
    uploadsService.uploadImage.mockResolvedValue({
      url: 'https://example.com/new.png',
      publicId: 'users/new',
    });
    userRepository.updateProfileImage.mockResolvedValue({
      ...user,
      profileImageUrl: 'https://example.com/new.png',
      profileImagePublicId: 'users/new',
    });

    await expect(
      service.updateProfileImage(1, {
        buffer: Buffer.from('image'),
        mimetype: 'image/png',
        originalname: 'profile.png',
        size: 5,
      }),
    ).resolves.toMatchObject({
      id: 1,
      profileImageUrl: 'https://example.com/new.png',
    });
    expect(userRepository.updateProfileImage).toHaveBeenCalledWith(1, {
      url: 'https://example.com/new.png',
      publicId: 'users/new',
    });
    expect(uploadsService.deleteFile).toHaveBeenCalledWith('users/old');
  });
});
