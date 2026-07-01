import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { StoreService } from '../../store/store.service';
import { ShopifyOrderPayload } from '../dto/shopify-webhook.dto';
import { OrderOutcomeEnum, RtoSignalEnum } from '../../../shared/enums';

/**
 * orders/cancelled (§11): if the store treats CANCELLED as an RTO signal,
 * record the RTO outcome (which updates the shared profile and re-tags the
 * order). No-op otherwise.
 */
@Injectable()
export class OrderCancelledHandler {
  private readonly logger = new Logger(OrderCancelledHandler.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly storeService: StoreService,
  ) {}

  async handle(shopDomain: string, order: ShopifyOrderPayload): Promise<void> {
    const store = await this.storeService.findByDomain(shopDomain);
    if (!store?.rtoSignals?.includes(RtoSignalEnum.CANCELLED)) {
      return; // CANCELLED is not an RTO signal for this store
    }

    const applied = await this.ordersService.applyOutcomeByShopifyOrderId(
      shopDomain,
      String(order.id),
      OrderOutcomeEnum.RTO,
    );
    if (!applied) {
      this.logger.warn(
        `Cancelled order ${order.id} (${shopDomain}) has no local record — skipped`,
      );
    }
  }
}
