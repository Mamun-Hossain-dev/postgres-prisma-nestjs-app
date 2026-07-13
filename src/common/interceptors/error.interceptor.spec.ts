import {
  CallHandler,
  ConflictException,
  ExecutionContext,
} from '@nestjs/common';
import { firstValueFrom, throwError } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  const interceptor = new ErrorInterceptor();
  const context = {} as ExecutionContext;

  it('preserves expected HTTP exceptions', async () => {
    const error = new ConflictException('Already exists');
    const next = {
      handle: () => throwError(() => error),
    } as CallHandler;

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(error);
  });

  it('converts unexpected errors to a safe application exception', async () => {
    const next = {
      handle: () => throwError(() => new Error('secret infrastructure error')),
    } as CallHandler;

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    });
  });
});
