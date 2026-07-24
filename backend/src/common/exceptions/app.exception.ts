import { HttpException, HttpStatus } from '@nestjs/common';

export interface AppExceptionOptions {
  code: string;
  status?: HttpStatus;
  details?: unknown;
  cause?: unknown;
}

/** A safe, domain-aware error that can be returned by the HTTP layer. */
export class AppException extends HttpException {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, options: AppExceptionOptions) {
    super(message, options.status ?? HttpStatus.INTERNAL_SERVER_ERROR, {
      cause: options.cause,
    });
    this.code = options.code;
    this.details = options.details;
  }
}
