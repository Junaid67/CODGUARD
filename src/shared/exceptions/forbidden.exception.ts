import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/server-response';

export class ForbiddenException extends ApiException {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(ERROR_CODES.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}
