import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';
import { ERROR_CODES } from '../constants/server-response';

/**
 * Thrown when a request is well-formed but violates a domain rule
 * (e.g. accepting terms before selecting signals). Maps to 422.
 */
export class BusinessRuleFailureException extends ApiException {
  constructor(message: string, name: string = ERROR_CODES.BUSINESS_RULE_FAILURE) {
    super(name, message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
