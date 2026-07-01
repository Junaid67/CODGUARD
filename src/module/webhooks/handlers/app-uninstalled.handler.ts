import { Injectable, Logger } from '@nestjs/common';
import { StoreService } from '../../store/store.service';
import { OrdersService } from '../../orders/orders.service';
import { AuditService } from '../../audit/audit.service';

/**
 * app/uninstalled (§11): soft-delete the store and its order records so the
 * merchant's data is removed, but KEEP the cross-store phone profile
 * contributions (anonymized aggregate data the network relies on).
 */
@Injectable()
export class AppUninstalledHandler {
  private readonly logger = new Logger(AppUninstalledHandler.name);

  constructor(
    private readonly storeService: StoreService,
    private readonly ordersService: OrdersService,
    private readonly auditService: AuditService,
  ) {}

  async handle(shopDomain: string): Promise<void> {
    await this.ordersService.softDeleteByShop(shopDomain);
    await this.storeService.softDeleteByDomain(shopDomain);

    await this.auditService.logSuccess('APP_UNINSTALLED', {
      shopDomain,
      actor: 'webhook',
    });
    this.logger.log(
      `App uninstalled for ${shopDomain} — store/orders soft-deleted, contributions retained`,
    );
  }
}
