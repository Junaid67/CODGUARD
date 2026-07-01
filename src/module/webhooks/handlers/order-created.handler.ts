import { Injectable, Logger } from '@nestjs/common';
import { RiskService } from '../../risk/risk.service';
import { OrdersService } from '../../orders/orders.service';
import { StoreService } from '../../store/store.service';
import { EncryptionService } from '../../../core/services';
import { ShopifyOrderPayload } from '../dto/shopify-webhook.dto';
import { normalizePhone } from '../../../shared/utils';
import { OrderOutcomeEnum, RiskLevelEnum } from '../../../shared/enums';

/**
 * orders/create (§11): score the incoming order's phone, tag the order, persist
 * a local record, and increment the store's monthly order count.
 */
@Injectable()
export class OrderCreatedHandler {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  constructor(
    private readonly riskService: RiskService,
    private readonly ordersService: OrdersService,
    private readonly storeService: StoreService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async handle(shopDomain: string, order: ShopifyOrderPayload): Promise<void> {
    const shopifyOrderId = String(order.id);
    const phoneRaw = this.extractPhone(order);
    const normalized = phoneRaw ? normalizePhone(phoneRaw) : null;

    let riskLevel = RiskLevelEnum.UNKNOWN;
    let deliveryRate: number | null = null;
    let phoneHash: string | null = null;
    let phoneEncrypted: string | null = null;

    if (normalized) {
      const score = await this.riskService.scorePhone(normalized);
      riskLevel = score.riskLevel;
      deliveryRate = score.deliveryRate;
      phoneHash = this.encryptionService.hash(normalized);
      phoneEncrypted = this.encryptionService.encrypt(normalized);
    } else {
      this.logger.warn(
        `Order ${shopifyOrderId} (${shopDomain}): phone missing/invalid — scored UNKNOWN`,
      );
    }

    await this.ordersService.upsert({
      shopDomain,
      shopifyOrderId,
      orderNumber: order.name ?? String(order.order_number ?? shopifyOrderId),
      customerName: this.extractCustomerName(order),
      phoneHash,
      phoneEncrypted,
      email: order.email ?? null,
      riskLevel,
      deliveryRateAtOrderTime: deliveryRate,
      outcome: OrderOutcomeEnum.PENDING,
      shopifyTags: this.parseTags(order.tags),
      shopifyFinancialStatus: order.financial_status ?? null,
      shopifyFulfillmentStatus: order.fulfillment_status ?? null,
      orderTotal: order.total_price ? Number(order.total_price) : null,
      currency: order.currency ?? null,
      shopifyCreatedAt: order.created_at ? new Date(order.created_at) : null,
    });

    // Tag the order in Shopify with the risk level (best-effort).
    await this.ordersService.tagOrderRisk(shopDomain, shopifyOrderId, riskLevel);

    await this.storeService.incrementMonthlyOrderCount(shopDomain);
  }

  private extractPhone(order: ShopifyOrderPayload): string | null {
    return (
      order.phone ||
      order.customer?.phone ||
      order.shipping_address?.phone ||
      order.billing_address?.phone ||
      null
    );
  }

  private extractCustomerName(order: ShopifyOrderPayload): string | null {
    if (order.customer?.first_name || order.customer?.last_name) {
      return `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim();
    }
    return order.shipping_address?.name ?? null;
  }

  private parseTags(tags?: string | null): string[] {
    if (!tags) return [];
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
}
