import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../exceptions/app.exception';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const status = jest.fn().mockReturnThis();
  const json = jest.fn();
  const setHeader = jest.fn();
  const response = { status, json, setHeader };
  const request = {
    method: 'GET',
    originalUrl: '/users/99',
    url: '/users/99',
    headers: { 'x-request-id': 'test-request-id' },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ArgumentsHost;

  beforeEach(() => jest.clearAllMocks());

  it('returns a stable response for domain exceptions', () => {
    const filter = new HttpExceptionFilter({
      get: jest.fn().mockReturnValue(true),
    } as unknown as ConfigService);

    filter.catch(
      new AppException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 404,
        path: '/users/99',
        requestId: 'test-request-id',
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      }),
    );
  });

  it('includes validation messages as details', () => {
    const filter = new HttpExceptionFilter({
      get: jest.fn().mockReturnValue(true),
    } as unknown as ConfigService);

    filter.catch(new BadRequestException(['email must be an email']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          details: ['email must be an email'],
        },
      }),
    );
  });
});
