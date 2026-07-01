import { Injectable, Logger } from '@nestjs/common';

/**
 * Centralized error logging/normalization helper. Keeps logging of failures
 * consistent across services and ensures sensitive values are never emitted.
 *
 * The GlobalExceptionFilter handles HTTP shaping; this service is for
 * services/handlers that want to record an error with context before
 * rethrowing.
 */
@Injectable()
export class ErrorService {
  private readonly logger = new Logger(ErrorService.name);

  logError(context: string, error: unknown, meta?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(
      `[${context}] ${message}${meta ? ` | ${JSON.stringify(meta)}` : ''}`,
      stack,
    );
  }
}
