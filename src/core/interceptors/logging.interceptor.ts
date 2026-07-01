import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logs every HTTP request/response with method, path, status, duration and the
 * correlation requestId. Never logs request bodies (may contain phone numbers
 * or tokens).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const { method, originalUrl } = req;
    const requestId = req.requestId ?? '-';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(
            `[${requestId}] ${method} ${originalUrl} ${res.statusCode} ${ms}ms`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = err?.status ?? 500;
          this.logger.warn(
            `[${requestId}] ${method} ${originalUrl} ${status} ${ms}ms - ${err?.message ?? 'error'}`,
          );
        },
      }),
    );
  }
}
