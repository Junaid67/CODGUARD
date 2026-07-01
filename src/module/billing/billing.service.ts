import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingRepository } from './billing.repository';
import { BillingResponseDto } from './dto/billing-response.dto';
import { ShopifyService } from '../shopify-auth/shopify.service';
import { StoreService } from '../store/store.service';
import { AuditService } from '../audit/audit.service';
import { PlanEnum } from '../../shared/enums';
import { FREE_TRIAL_DAYS, PLAN_LIMITS } from '../../shared/constants';
import { BusinessRuleFailureException } from '../../shared/exceptions';

interface AppSubscriptionCreateResponse {
  appSubscriptionCreate: {
    appSubscription: { id: string; status: string } | null;
    confirmationUrl: string | null;
    userErrors: { field: string[]; message: string }[];
  };
}

interface ActiveSubscriptionsResponse {
  currentAppInstallation: {
    activeSubscriptions: {
      id: string;
      status: string;
      name: string;
      currentPeriodEnd: string | null;
    }[];
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly shopifyService: ShopifyService,
    private readonly storeService: StoreService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Starts a subscription (§13). FREE applies immediately with no charge.
   * Paid plans create a Shopify appSubscription (14-day trial) and return a
   * confirmationUrl the merchant must approve.
   */
  async createSubscription(
    shopDomain: string,
    plan: PlanEnum,
  ): Promise<BillingResponseDto> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);

    if (plan === PlanEnum.FREE) {
      await this.storeService.updatePlan(shopDomain, PlanEnum.FREE);
      await this.upsertBilling(shopDomain, PlanEnum.FREE, 'ACTIVE', null, null, null);
      return { plan: PlanEnum.FREE, status: 'ACTIVE', trialEndsAt: null, billingOn: null };
    }

    const price = PLAN_LIMITS[plan].priceUsd;
    const session = this.shopifyService.buildOfflineSession(
      store.shopDomain,
      this.storeService.getDecryptedAccessToken(store),
    );
    const appUrl = this.configService.get<string>('app.url');
    const isTest = this.configService.get<string>('app.env') !== 'production';

    const data = await this.shopifyService.graphql<AppSubscriptionCreateResponse>(
      session,
      `mutation appSubscriptionCreate(
        $name: String!, $returnUrl: URL!, $trialDays: Int!, $test: Boolean!,
        $price: Decimal!
      ) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          trialDays: $trialDays
          test: $test
          lineItems: [{
            plan: { appRecurringPricingDetails: {
              price: { amount: $price, currencyCode: USD }
              interval: EVERY_30_DAYS
            } }
          }]
        ) {
          appSubscription { id status }
          confirmationUrl
          userErrors { field message }
        }
      }`,
      {
        name: `${plan.toUpperCase()} Plan`,
        returnUrl: `${appUrl}/api/v1/billing/callback?shop=${encodeURIComponent(shopDomain)}`,
        trialDays: FREE_TRIAL_DAYS,
        test: isTest,
        price: price.toFixed(2),
      },
    );

    const result = data.appSubscriptionCreate;
    if (result.userErrors?.length) {
      throw new BusinessRuleFailureException(
        `Billing error: ${result.userErrors.map((e) => e.message).join('; ')}`,
        'BILLING_USER_ERROR',
      );
    }

    const trialEndsAt = new Date(Date.now() + FREE_TRIAL_DAYS * 86400000);
    await this.upsertBilling(
      shopDomain,
      plan,
      'PENDING',
      result.appSubscription?.id ?? null,
      trialEndsAt,
      null,
    );

    return {
      plan,
      status: 'PENDING',
      trialEndsAt,
      billingOn: null,
      confirmationUrl: result.confirmationUrl,
    };
  }

  /**
   * Billing return callback: confirm the subscription is active on Shopify,
   * then apply the plan to the store. Returns the embedded-app URL to redirect
   * the merchant back to.
   */
  async activateFromCallback(shopDomain: string): Promise<string> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    const session = this.shopifyService.buildOfflineSession(
      store.shopDomain,
      this.storeService.getDecryptedAccessToken(store),
    );

    const data = await this.shopifyService.graphql<ActiveSubscriptionsResponse>(
      session,
      `query {
        currentAppInstallation {
          activeSubscriptions { id status name currentPeriodEnd }
        }
      }`,
    );

    const active = data.currentAppInstallation?.activeSubscriptions?.[0];
    const pending = await this.billingRepository.findLatestByShop(shopDomain);

    if (active && active.status === 'ACTIVE' && pending) {
      const billingOn = active.currentPeriodEnd
        ? new Date(active.currentPeriodEnd)
        : null;
      await this.storeService.updatePlan(shopDomain, pending.plan, active.id);
      await this.upsertBilling(
        shopDomain,
        pending.plan,
        'ACTIVE',
        active.id,
        pending.trialEndsAt ?? null,
        billingOn,
      );
      await this.auditService.logSuccess('BILLING_ACTIVATED', {
        shopDomain,
        actor: 'billing',
      });
      this.logger.log(`Subscription activated for ${shopDomain}: ${pending.plan}`);
    }

    return this.shopifyService.buildAppRedirectUrl(shopDomain);
  }

  /**
   * Handles the APP_SUBSCRIPTIONS_UPDATE webhook — syncs status and downgrades
   * to FREE when a subscription is cancelled/expired.
   */
  async handleSubscriptionUpdate(
    shopDomain: string,
    subscription: { admin_graphql_api_id?: string; name?: string; status?: string },
  ): Promise<void> {
    const status = (subscription.status ?? '').toUpperCase();
    const latest = await this.billingRepository.findLatestByShop(shopDomain);
    const plan = latest?.plan ?? PlanEnum.FREE;

    if (['CANCELLED', 'EXPIRED', 'DECLINED', 'FROZEN'].includes(status)) {
      await this.storeService.updatePlan(shopDomain, PlanEnum.FREE);
      await this.upsertBilling(shopDomain, PlanEnum.FREE, 'CANCELLED', subscription.admin_graphql_api_id ?? null, null, null);
      this.logger.log(`Subscription ${status} for ${shopDomain} → downgraded to FREE`);
    } else if (status === 'ACTIVE') {
      await this.storeService.updatePlan(shopDomain, plan, subscription.admin_graphql_api_id);
      await this.upsertBilling(shopDomain, plan, 'ACTIVE', subscription.admin_graphql_api_id ?? null, latest?.trialEndsAt ?? null, latest?.billingOn ?? null);
    }
  }

  /** Current billing view. */
  async getCurrentBilling(shopDomain: string): Promise<BillingResponseDto> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    const latest = await this.billingRepository.findLatestByShop(shopDomain);
    return {
      plan: store.plan,
      status: latest?.status ?? 'ACTIVE',
      trialEndsAt: latest?.trialEndsAt ?? null,
      billingOn: latest?.billingOn ?? null,
    };
  }

  /** Inserts a new billing record snapshot (history is append-only friendly). */
  private async upsertBilling(
    shopDomain: string,
    plan: PlanEnum,
    status: string,
    subscriptionId: string | null,
    trialEndsAt: Date | null,
    billingOn: Date | null,
  ): Promise<void> {
    const record = this.billingRepository.create({
      shopDomain,
      plan,
      status,
      shopifySubscriptionId: subscriptionId ?? undefined,
      trialEndsAt: trialEndsAt ?? undefined,
      billingOn: billingOn ?? undefined,
    });
    await this.billingRepository.save(record);
  }
}
