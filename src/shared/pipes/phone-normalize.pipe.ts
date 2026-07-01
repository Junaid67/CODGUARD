import { Injectable, PipeTransform } from '@nestjs/common';
import { normalizePhone } from '../utils/phone.util';
import { BusinessRuleFailureException } from '../exceptions';

/**
 * Normalizes a single Pakistani phone-number parameter to +923XXXXXXXXX.
 * Throws BusinessRuleFailureException for un-normalizable input. Use as a
 * param/query pipe, e.g. @Query('phone', PhoneNormalizePipe).
 */
@Injectable()
export class PhoneNormalizePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const normalized = normalizePhone(value);
    if (!normalized) {
      throw new BusinessRuleFailureException(
        'Invalid Pakistani phone number',
        'INVALID_PHONE',
      );
    }
    return normalized;
  }
}
