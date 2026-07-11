import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/interfaces/user.interface';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role: Role.ADMIN } }),
    }),
  } as unknown as ExecutionContext;

  it('allows a user with a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;

    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('denies a user without a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.USER]),
    } as unknown as Reflector;

    expect(new RolesGuard(reflector).canActivate(context)).toBe(false);
  });

  it('allows access when no roles metadata exists', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });
});
