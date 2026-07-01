import { HttpStatus } from '@nestjs/common';
import { ApiException } from './api.exception';
import { ERROR_CODES } from '../constants/server-response';
import { PlanEnum } from '../enums';

/**
 * Thrown by PlanLimitGuard when a store exceeds its plan's monthly order limit.
 * Maps to 402 Payment Required → the embedded app prompts an upgrade.
 */
export class PlanLimitExceededException extends ApiException {
  constructor(plan: PlanEnum, limit: number) {
    super(
      ERROR_CODES.PLAN_LIMIT_EXCEEDED,
      `Your ${plan} plan allows ${limit} orders per month. Upgrade to continue.`,
      HttpStatus.PAYMENT_REQUIRED,
      { plan, limit },
    );
  }
}
