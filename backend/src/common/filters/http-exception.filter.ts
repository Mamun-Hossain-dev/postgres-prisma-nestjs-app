import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AppException } from '../exceptions/app.exception';

interface ErrorPayload {
  success: false;
  statusCode: number;
  error: { code: string; message: string; details?: unknown };
  timestamp: string;
  path: string;
  requestId: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const isProduction = this.configService.get<boolean>(
      'app.isProduction',
      false,
    );
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = this.getRequestId(request);
    const error = this.getError(exception, status, isProduction);

    const payload: ErrorPayload = {
      success: false,
      statusCode: status,
      error,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      requestId,
    };

    response.setHeader('x-request-id', requestId);
    this.log(exception, request, status, requestId);
    response.status(status).json(payload);
  }

  private getError(
    exception: unknown,
    status: number,
    isProduction: boolean,
  ): ErrorPayload['error'] {
    if (exception instanceof AppException) {
      return {
        code: exception.code,
        message: exception.message,
        ...(exception.details !== undefined && {
          details: exception.details,
        }),
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const body = response as Record<string, unknown>;
        const rawMessage = body.message;
        const message = Array.isArray(rawMessage)
          ? 'Validation failed'
          : typeof rawMessage === 'string'
            ? rawMessage
            : exception.message;

        return {
          code: this.statusCodeToErrorCode(status),
          message,
          ...(Array.isArray(rawMessage) && { details: rawMessage }),
        };
      }

      return {
        code: this.statusCodeToErrorCode(status),
        message: typeof response === 'string' ? response : exception.message,
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : exception instanceof Error
          ? exception.message
          : 'An unexpected error occurred',
    };
  }

  private getRequestId(request: Request): string {
    const value = request.headers['x-request-id'];
    return typeof value === 'string' && value.trim() ? value : randomUUID();
  }

  private statusCodeToErrorCode(status: number): string {
    return (HttpStatus[status] ?? 'HTTP_ERROR').toString().toUpperCase();
  }

  private log(
    exception: unknown,
    request: Request,
    status: number,
    requestId: string,
  ): void {
    const message = `${request.method} ${request.originalUrl ?? request.url} ${status} requestId=${requestId}`;
    const cause =
      exception instanceof HttpException ? exception.cause : undefined;
    const stack =
      cause instanceof Error
        ? cause.stack
        : exception instanceof Error
          ? exception.stack
          : undefined;

    if (status >= 500) this.logger.error(message, stack);
    else this.logger.warn(message);
  }
}
