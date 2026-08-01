import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserRepository } from '../users/repositories/user.repository';
import { USER_REPOSITORY } from '../users/constants/user.tokens';
import * as bcrypt from 'bcrypt';
import { AuthSessionService } from './auth-session.service';
import { Role } from '../users/interfaces/user.interface';
import { UserEventsPublisher } from '../users/events/user-events.publisher';
import { GOOGLE_TOKEN_VERIFIER } from './constants/auth.tokens';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.MockedFunction<UserRepository['create']>;
    findByGoogleId: jest.Mock;
    linkGoogleAccount: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let authSessionService: {
    create: jest.Mock;
    rotate: jest.Mock;
    revoke: jest.Mock;
  };
  let userEventsPublisher: {
    publishCreated: jest.Mock;
  };
  let googleTokenVerifier: { verify: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn<UserRepository['create']>(),
      findByGoogleId: jest.fn(),
      linkGoogleAccount: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };
    authSessionService = {
      create: jest.fn().mockResolvedValue({
        refreshToken: 'session-id.refresh-secret',
        expiresAt: new Date('2026-08-14T00:00:00.000Z'),
      }),
      rotate: jest.fn(),
      revoke: jest.fn(),
    };
    userEventsPublisher = {
      publishCreated: jest.fn().mockResolvedValue(undefined),
    };
    googleTokenVerifier = { verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
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
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: AuthSessionService,
          useValue: authSessionService,
        },
        {
          provide: UserEventsPublisher,
          useValue: userEventsPublisher,
        },
        {
          provide: GOOGLE_TOKEN_VERIFIER,
          useValue: googleTokenVerifier,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('normalizes the email, hashes the password, and assigns USER on register', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation((data: object) =>
      Promise.resolve({
        id: 1,
        age: 0,
        isBlocked: false,
        ...data,
      }),
    );

    const result = await service.register({
      name: 'Mamun',
      email: '  MAMUN@Example.COM ',
      password: 'secret123',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      'mamun@example.com',
    );
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'mamun@example.com',
        role: Role.USER,
      }),
    );
    expect(userRepository.create.mock.calls[0][0].password).toMatch(
      /^\$2[aby]\$/,
    );
    expect(result).not.toHaveProperty('password');
    expect(userEventsPublisher.publishCreated).toHaveBeenCalledWith(result);
  });

  it('does not delay registration while user-created events are publishing', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation((data: object) =>
      Promise.resolve({
        id: 1,
        age: 0,
        isBlocked: false,
        ...data,
      }),
    );
    userEventsPublisher.publishCreated.mockReturnValue(
      new Promise<void>(() => undefined),
    );

    await expect(
      service.register({
        name: 'Mamun',
        email: 'mamun@example.com',
        password: 'secret123',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        email: 'mamun@example.com',
      }),
    );
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
      service.login(
        {
          email: 'mamun@example.com',
          password: 'secret123',
        },
        { ip: '127.0.0.1', device: 'desktop', userAgent: 'jest' },
      ),
    ).resolves.toEqual({
      auth: {
        accessToken: 'signed-jwt-token',
        tokenType: 'Bearer',
        user: {
          id: 1,
          name: 'Mamun',
          email: 'mamun@example.com',
          age: 24,
        },
      },
      refreshToken: 'session-id.refresh-secret',
      refreshTokenExpiresAt: new Date('2026-08-14T00:00:00.000Z'),
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'mamun@example.com',
    });
  });

  it('rejects login for a blocked user', async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: 1,
      name: 'Blocked User',
      email: 'blocked@example.com',
      age: 24,
      password: await bcrypt.hash('secret123', 10),
      role: 'USER',
      isBlocked: true,
    });

    await expect(
      service.login(
        {
          email: 'blocked@example.com',
          password: 'secret123',
        },
        { ip: '127.0.0.1', device: 'desktop', userAgent: 'jest' },
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: 'USER_BLOCKED',
    });
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rotates the refresh session and returns a new access token', async () => {
    const expiresAt = new Date('2026-08-14T00:00:00.000Z');
    authSessionService.rotate.mockResolvedValue({
      userId: 1,
      refreshToken: 'same-session.new-secret',
      expiresAt,
    });
    userRepository.findById.mockResolvedValue({
      id: 1,
      name: 'Mamun',
      email: 'mamun@example.com',
      age: 24,
      password: 'hashed-password',
      role: 'USER',
      isBlocked: false,
    });

    await expect(
      service.refresh('same-session.old-secret', {
        ip: '127.0.0.1',
        device: 'desktop',
        userAgent: 'jest',
      }),
    ).resolves.toMatchObject({
      auth: { accessToken: 'signed-jwt-token' },
      refreshToken: 'same-session.new-secret',
      refreshTokenExpiresAt: expiresAt,
    });
    expect(authSessionService.rotate).toHaveBeenCalledWith(
      'same-session.old-secret',
      expect.objectContaining({ ip: '127.0.0.1' }),
    );
  });

  it('creates a password-less user and session from a verified Google identity', async () => {
    googleTokenVerifier.verify.mockResolvedValue({
      subject: 'google-123',
      email: 'Mamun@Example.com',
      name: 'Mamun',
    });
    userRepository.findByGoogleId.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation((data: object) =>
      Promise.resolve({
        id: 1,
        age: 0,
        phone: null,
        password: null,
        isBlocked: false,
        marketingConsent: false,
        profileImageUrl: null,
        profileImagePublicId: null,
        ...data,
      }),
    );

    const result = await service.loginWithGoogle('google-id-token', {
      ip: '127.0.0.1',
      device: 'desktop',
      userAgent: 'jest',
    });

    expect(googleTokenVerifier.verify).toHaveBeenCalledWith('google-id-token');
    expect(userRepository.create).toHaveBeenCalledWith({
      name: 'Mamun',
      email: 'mamun@example.com',
      googleId: 'google-123',
      role: Role.USER,
    });
    expect(result.auth.user).not.toHaveProperty('googleId');
    expect(result.auth.accessToken).toBe('signed-jwt-token');
  });
});
