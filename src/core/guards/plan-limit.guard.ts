import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { StoreService } from '../../module/store/store.service';
import { PLAN_LIMITS } from '../../shared/constants';
import { PlanLimitExceededException } from '../../shared/exceptions';
import { AppUtil } from '../../shared/utils';

/**
 * Enforces each store's monthly order limit (§7.4). Resets the counter at the
 * start of a new calendar month, otherwise throws PlanLimitExceededException
 * (402 → upgrade required) once the plan's limit is reached. PRO is unlimited
 * (limit is Infinity, so the >= check never trips).
 *
 * Registered/exported by StoreModule (its StoreService dependency lives there);
 * apply per-route via @UseGuards(PlanLimitGuard) in modules that import
 * StoreModule.
 */
@Injectable()
export class PlanLimitGuard implements CanActivate {
  private readonly logger = new Logger(PlanLimitGuard.name);

  constructor(private readonly storeService: StoreService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const shopDomain = request.shopDomain;

    // No resolved shop (e.g. public route) — nothing to enforce.
    if (!shopDomain) return true;

    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    const limit = PLAN_LIMITS[store.plan].monthlyOrders;

    const now = new Date();
    if (
      !store.monthlyCountResetAt ||
      AppUtil.isDifferentMonth(store.monthlyCountResetAt, now)
    ) {
      await this.storeService.resetMonthlyCount(shopDomain);
      return true;
    }

    if (store.monthlyOrderCount >= limit) {
      throw new PlanLimitExceededException(store.plan, limit);
    }

    return true;
  }
}
