import {
  CallHandler,
  ConflictException,
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
        return new ConflictException(
          'A record with this value already exists',
          {
            cause: error,
          },
        );
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
