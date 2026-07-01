import { Injectable, Logger } from '@nestjs/common';
import { BillingService } from '../../billing/billing.service';
import { ShopifySubscriptionPayload } from '../dto/shopify-webhook.dto';

/**
 * app_subscriptions/update (§11): sync the subscription status — activate, or
 * downgrade to FREE on cancellation/expiry — via BillingService.
 */
@Injectable()
export class SubscriptionUpdatedHandler {
  private readonly logger = new Logger(SubscriptionUpdatedHandler.name);

  constructor(private readonly billingService: BillingService) {}

  async handle(
    shopDomain: string,
    payload: ShopifySubscriptionPayload,
  ): Promise<void> {
    if (!payload.app_subscription) {
      this.logger.warn(`Subscription webhook for ${shopDomain} had no app_subscription`);
      return;
    }
    await this.billingService.handleSubscriptionUpdate(
      shopDomain,
      payload.app_subscription,
    );
  }
}
