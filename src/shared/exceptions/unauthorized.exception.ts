import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/server-response';

export class UnAuthorizedException extends ApiException {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(ERROR_CODES.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }
}
