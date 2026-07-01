import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service';
import { StoreService } from '../../store/store.service';
import { ShopifyRefundPayload } from '../dto/shopify-webhook.dto';
import { OrderOutcomeEnum, RtoSignalEnum } from '../../../shared/enums';

/**
 * refunds/create (§11): if the store treats REFUNDED as an RTO signal, record
 * the RTO outcome for the refunded order. The refund payload only carries
 * order_id — the phone comes from the local order record.
 */
@Injectable()
export class RefundCreatedHandler {
  private readonly logger = new Logger(RefundCreatedHandler.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly storeService: StoreService,
  ) {}

  async handle(shopDomain: string, refund: ShopifyRefundPayload): Promise<void> {
    const store = await this.storeService.findByDomain(shopDomain);
    if (!store?.rtoSignals?.includes(RtoSignalEnum.REFUNDED)) {
      return; // REFUNDED is not an RTO signal for this store
    }

    const applied = await this.ordersService.applyOutcomeByShopifyOrderId(
      shopDomain,
      String(refund.order_id),
      OrderOutcomeEnum.RTO,
    );
    if (!applied) {
      this.logger.warn(
        `Refunded order ${refund.order_id} (${shopDomain}) has no local record — skipped`,
      );
    }
  }
}
