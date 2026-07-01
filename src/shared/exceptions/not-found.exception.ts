import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/server-response';

export class NotFoundException extends ApiException {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(ERROR_CODES.NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}
