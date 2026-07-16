import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { catchError, Observable, throwError } from 'rxjs';
import { AppException } from '../exceptions/app.exception';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(
        catchError((error: unknown) => throwError(() => this.normalize(error))),
      );
  }

  private normalize(error: unknown): HttpException {
    if (error instanceof HttpException) return error;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        const fields = Array.isArray(target)
          ? target.filter((field): field is string => typeof field === 'string')
          : typeof target === 'string'
            ? [target]
            : [];

        if (fields.includes('email')) {
          return new AppException('Email already in use', {
            code: 'EMAIL_ALREADY_IN_USE',
            status: 409,
            cause: error,
          });
        }

        return new AppException('A record with this value already exists', {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          status: 409,
          cause: error,
        });
      }

      if (error.code === 'P2025') {
        return new AppException('Requested resource was not found', {
          code: 'RESOURCE_NOT_FOUND',
          status: 404,
          cause: error,
        });
      }

      return new AppException('Database operation failed', {
        code: 'DATABASE_ERROR',
        cause: error,
      });
    }

    return new AppException('An unexpected error occurred', {
      code: 'INTERNAL_SERVER_ERROR',
      cause: error,
    });
  }
}
