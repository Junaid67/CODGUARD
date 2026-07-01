import { ApiErrorShape } from '../exceptions/api.exception';

/**
 * Shapes a standard error envelope. The GlobalExceptionFilter is the primary
 * producer of error responses; this wrapper is for places that construct the
 * envelope directly (e.g. raw express responses).
 */
export function constructErrorResponse(
  errors: ApiErrorShape[],
): { errors: ApiErrorShape[] } {
  return { errors };
}
