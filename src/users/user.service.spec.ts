import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 1,
              name: 'Test User',
              email: 'test@example.com',
              age: 20,
            }),
            update: jest.fn().mockResolvedValue(null),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
