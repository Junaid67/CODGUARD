import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ShopifyService } from './shopify.service';
import { StoreService } from '../store/store.service';
import { AuditService } from '../audit/audit.service';
import { BusinessRuleFailureException } from '../../shared/exceptions';

/**
 * Orchestrates the Shopify OAuth install flow (§10 step 1):
 *   begin → Shopify consent → callback → persist store (encrypted token) →
 *   register webhooks → redirect into the embedded app.
 */
@Injectable()
export class ShopifyAuthService {
  private readonly logger = new Logger(ShopifyAuthService.name);

  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly storeService: StoreService,
    private readonly auditService: AuditService,
  ) {}

  /** Step 1: redirect the merchant to Shopify's OAuth consent screen. */
  async begin(shop: string, req: Request, res: Response): Promise<void> {
    const shopify = this.shopifyService.getInstance();
    const sanitized = shopify.utils.sanitizeShop(shop, true);
    if (!sanitized) {
      throw new BusinessRuleFailureException('Invalid shop domain', 'INVALID_SHOP');
    }

    await shopify.auth.begin({
      shop: sanitized,
      callbackPath: '/api/v1/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
  }

  /**
   * Step 2: handle the OAuth callback — exchange code for an offline token,
   * persist the store (token encrypted at rest), register webhooks, then
   * redirect into the embedded app.
   */
  async callback(req: Request, res: Response): Promise<void> {
    const shopify = this.shopifyService.getInstance();

    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    if (!session.accessToken) {
      throw new BusinessRuleFailureException(
        'OAuth callback returned no access token',
        'NO_ACCESS_TOKEN',
      );
    }

    await this.storeService.createOrUpdate(session.shop, session.accessToken);

    // Register ongoing webhooks (best-effort; logged on failure).
    await this.shopifyService.registerWebhooks(session);

    await this.auditService.logSuccess('APP_INSTALLED', {
      shopDomain: session.shop,
      actor: 'oauth',
      ipAddress: req.ip,
    });
    this.logger.log(`App installed for ${session.shop}`);

    res.redirect(this.shopifyService.buildAppRedirectUrl(session.shop));
  }
}
