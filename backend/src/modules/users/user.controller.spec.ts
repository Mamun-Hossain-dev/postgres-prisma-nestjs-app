import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';

describe('UserController', () => {
  let controller: UserController;
  let deleteUser: jest.Mock;

  beforeEach(async () => {
    deleteUser = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue(5 * 1024 * 1024) },
        },
        {
          provide: UserService,
          useValue: {
            getAllUsers: jest.fn(),
            getUserById: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            deleteUser,
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('deletes the authenticated user account', async () => {
    await expect(controller.deleteMe({ id: 42 } as never)).resolves.toBeNull();
    expect(deleteUser).toHaveBeenCalledWith(42);
  });
});
