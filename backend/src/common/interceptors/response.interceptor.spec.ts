import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps controller data with the configured message', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('Users fetched'),
    } as unknown as Reflector;
    const interceptor = new ResponseInterceptor(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    const next = { handle: () => of([{ id: 1 }]) } as CallHandler;

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).resolves.toEqual({
      success: true,
      message: 'Users fetched',
      data: [{ id: 1 }],
    });
  });
});
