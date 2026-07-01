import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorShape {
  name: string;
  message: string;
}

/**
 * Base for all typed application exceptions. Serializes to the standard error
 * envelope `{ errors: [{ name, message }] }` consumed by GlobalExceptionFilter.
 */
export class ApiException extends HttpException {
  constructor(
    name: string,
    message: string,
    status: HttpStatus,
    extra?: Record<string, unknown>,
  ) {
    super({ errors: [{ name, message }], ...(extra ?? {}) }, status);
  }
}
