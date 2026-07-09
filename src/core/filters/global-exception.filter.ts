import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches every unhandled exception and shapes a consistent error envelope:
 *
 *   { errors: [{ name, message }], requestId, statusCode, path, timestamp }
 *
 * In step 4 (Shared) this is aligned with the typed exceptions and
 * error-status wrapper; the envelope shape is intentionally kept stable so
 * those plug in without breaking clients.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errors = this.extractErrors(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.requestId ?? '-'}] ${request.method} ${request.originalUrl} ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      errors,
      statusCode: status,
      path: request.originalUrl,
      requestId: request.requestId ?? null,
      timestamp: new Date().toISOString(),
    });
  }

  private extractErrors(
    exception: unknown,
    status: number,
  ): Array<{ name: string; message: string }> {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return [{ name: exception.name, message: res }];
      }
      if (res && typeof res === 'object') {
        const body = res as Record<string, unknown>;
        // Pass through an already-shaped { errors: [...] } payload.
        if (Array.isArray(body.errors)) {
          return body.errors as Array<{ name: string; message: string }>;
        }
        const message = body.message;
        if (Array.isArray(message)) {
          return message.map((m) => ({ name: 'VALIDATION_ERROR', message: String(m) }));
        }
        return [
          {
            name: (body.error as string) ?? exception.name,
            message: String(message ?? exception.message),
          },
        ];
      }
    }

    // Unknown / non-HTTP error.
    // In dev expose the real message so the UI shows something actionable;
    // in production always return a generic message (never leak internals).
    const isDev = process.env.NODE_ENV !== 'production';
    const realMessage =
      exception instanceof Error
        ? `${exception.constructor.name}: ${exception.message}`
        : String(exception);

    return [
      {
        name: 'INTERNAL_SERVER_ERROR',
        message:
          isDev
            ? realMessage
            : status >= HttpStatus.INTERNAL_SERVER_ERROR
            ? 'An unexpected error occurred'
            : String((exception as Error)?.message ?? 'Error'),
      },
    ];
  }
}
