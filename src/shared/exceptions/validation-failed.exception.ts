import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/server-response';

/**
 * Wraps class-validator ValidationError[] into the standard error envelope.
 * Used as the ValidationPipe exceptionFactory in main.ts. Each failed
 * constraint becomes one `{ name: 'VALIDATION_FAILED', message }` entry,
 * including nested children.
 */
export class ValidationFailedException extends HttpException {
  constructor(errors: ValidationError[]) {
    const messages = ValidationFailedException.flatten(errors);
    super(
      {
        errors:
          messages.length > 0
            ? messages.map((m) => ({
                name: ERROR_CODES.VALIDATION_FAILED,
                message: m,
              }))
            : [
                {
                  name: ERROR_CODES.VALIDATION_FAILED,
                  message: ERROR_MESSAGES.VALIDATION_FAILED,
                },
              ],
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  private static flatten(errors: ValidationError[], parent = ''): string[] {
    const messages: string[] = [];
    for (const error of errors) {
      const path = parent ? `${parent}.${error.property}` : error.property;
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }
      if (error.children && error.children.length > 0) {
        messages.push(...ValidationFailedException.flatten(error.children, path));
      }
    }
    return messages;
  }
}
