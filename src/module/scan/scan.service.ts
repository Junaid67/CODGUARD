import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Session } from '@shopify/shopify-api';
import { ShopifyService } from '../shopify-auth/shopify.service';
import { StoreService } from '../store/store.service';
import { RiskService } from '../risk/risk.service';
import { OrdersService } from '../orders/orders.service';
import { EncryptionService } from '../../core/services';
import { ScanPreviewResponseDto } from './dto/scan-preview-response.dto';
import { ConfirmScanDto } from './dto/confirm-scan.dto';
import { StoreEntity } from '../store/entity/store.entity';
import {
  BusinessRuleFailureException,
  ForbiddenException,
} from '../../shared/exceptions';
import { PLAN_FEATURES } from '../../shared/constants';
import { OrderOutcomeEnum, RtoSignalEnum } from '../../shared/enums';
import { maskPhone, matchRtoSignals, normalizePhone } from '../../shared/utils';

/** Order node shape returned by the bulk orders query. */
interface BulkOrderNode {
  id: string;
  name?: string;
  createdAt?: string;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  tags?: string[];
  note?: string | null;
  totalPriceSet?: { shopMoney?: { amount?: string; currencyCode?: string } };
  customer?: { firstName?: string; lastName?: string; phone?: string | null } | null;
  shippingAddress?: { phone?: string | null; name?: string | null } | null;
  billingAddress?: { phone?: string | null } | null;
}

interface ClassifiedOrder {
  node: BulkOrderNode;
  shopifyOrderId: string;
  matchedSignals: RtoSignalEnum[];
}

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  // Bounded polling for the bulk operation. NOTE: a production deployment
  // should instead handle the bulk_operations/finish webhook rather than block
  // the request — this synchronous poll keeps onboarding simple.
  private readonly POLL_ATTEMPTS = 20;
  private readonly POLL_DELAY_MS = 1500;

  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly storeService: StoreService,
    private readonly riskService: RiskService,
    private readonly ordersService: OrdersService,
    private readonly encryptionService: EncryptionService,
    private readonly httpService: HttpService,
  ) {}

  /** Step 3: preview probable RTOs over a date range (not committed). */
  async preview(
    shopDomain: string,
    dateRangeDays: number,
  ): Promise<ScanPreviewResponseDto> {
    this.logger.log(`preview: shop=${shopDomain} dateRangeDays=${dateRangeDays}`);
    const { store, session } = await this.getStoreSession(shopDomain);
    this.assertSignalsConfigured(store);

    const orders = await this.runBulkScan(session, dateRangeDays);
    const classified = this.classify(orders, store);

    return {
      dateRangeDays,
      totalOrdersScanned: orders.length,
      probableRtoCount: classified.length,
      items: classified.map((c) => ({
        shopifyOrderId: c.shopifyOrderId,
        orderNumber: c.node.name ?? c.shopifyOrderId,
        customerName: this.extractName(c.node),
        phoneMasked: maskPhone(normalizePhone(this.extractPhone(c.node) ?? '')),
        matchedSignals: c.matchedSignals,
        orderTotal: c.node.totalPriceSet?.shopMoney?.amount
          ? Number(c.node.totalPriceSet.shopMoney.amount)
          : null,
        currency: c.node.totalPriceSet?.shopMoney?.currencyCode ?? null,
        createdAt: c.node.createdAt ? new Date(c.node.createdAt) : null,
      })),
    };
  }

  /** Step 5: commit the scan — record RTOs (minus excluded), complete onboarding. */
  async confirm(
    shopDomain: string,
    dto: ConfirmScanDto,
  ): Promise<{
    totalScanned: number;
    rtoProcessed: number;
    excluded: number;
    onboardingComplete: boolean;
  }> {
    const { store, session } = await this.getStoreSession(shopDomain);
    this.assertSignalsConfigured(store);

    const orders = await this.runBulkScan(session, dto.dateRangeDays);
    const classified = this.classify(orders, store);
    const excluded = new Set(dto.excludedOrderIds);

    let rtoProcessed = 0;
    for (const c of classified) {
      if (excluded.has(c.shopifyOrderId)) continue;
      const processed = await this.processRtoOrder(shopDomain, c);
      if (processed) rtoProcessed += 1;
    }

    await this.storeService.recordScan(shopDomain, orders.length);
    await this.storeService.markOnboardingComplete(shopDomain);

    this.logger.log(
      `Scan confirmed for ${shopDomain}: ${rtoProcessed} RTOs from ${orders.length} orders`,
    );

    return {
      totalScanned: orders.length,
      rtoProcessed,
      excluded: excluded.size,
      onboardingComplete: true,
    };
  }

  /** Re-run a scan post-onboarding (GROWTH/PRO only). */
  async rescan(
    shopDomain: string,
    dateRangeDays: number,
  ): Promise<{ totalScanned: number; rtoProcessed: number }> {
    this.logger.log(`rescan: shop=${shopDomain} dateRangeDays=${dateRangeDays}`);
    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    if (!PLAN_FEATURES[store.plan].rescan) {
      throw new ForbiddenException('Re-scan requires the GROWTH or PRO plan');
    }
    const result = await this.confirm(shopDomain, {
      excludedOrderIds: [],
      dateRangeDays,
    });
    return { totalScanned: result.totalScanned, rtoProcessed: result.rtoProcessed };
  }

  // ---- internals --------------------------------------------------------

  private async processRtoOrder(
    shopDomain: string,
    c: ClassifiedOrder,
  ): Promise<boolean> {
    const phoneRaw = this.extractPhone(c.node);
    const normalized = phoneRaw ? normalizePhone(phoneRaw) : null;
    if (!normalized) {
      this.logger.warn(
        `Scan: order ${c.shopifyOrderId} has no valid phone — skipped`,
      );
      return false;
    }

    await this.riskService.recordOutcome(
      normalized,
      OrderOutcomeEnum.RTO,
      shopDomain,
      c.shopifyOrderId,
    );

    const score = await this.riskService.scorePhone(normalized);
    await this.ordersService.upsert({
      shopDomain,
      shopifyOrderId: c.shopifyOrderId,
      orderNumber: c.node.name ?? c.shopifyOrderId,
      customerName: this.extractName(c.node),
      phoneHash: this.encryptionService.hash(normalized),
      phoneEncrypted: this.encryptionService.encrypt(normalized),
      riskLevel: score.riskLevel,
      deliveryRateAtOrderTime: score.deliveryRate,
      outcome: OrderOutcomeEnum.RTO,
      shopifyTags: c.node.tags ?? [],
      shopifyFinancialStatus: c.node.displayFinancialStatus ?? null,
      shopifyFulfillmentStatus: c.node.displayFulfillmentStatus ?? null,
      orderTotal: c.node.totalPriceSet?.shopMoney?.amount
        ? Number(c.node.totalPriceSet.shopMoney.amount)
        : null,
      currency: c.node.totalPriceSet?.shopMoney?.currencyCode ?? null,
      shopifyCreatedAt: c.node.createdAt ? new Date(c.node.createdAt) : null,
    });

    await this.ordersService.tagOrderRisk(
      shopDomain,
      c.shopifyOrderId,
      score.riskLevel,
    );
    return true;
  }

  /** Classifies orders against the store's configured signals. */
  private classify(orders: BulkOrderNode[], store: StoreEntity): ClassifiedOrder[] {
    const result: ClassifiedOrder[] = [];

    for (const node of orders) {
      const matched: RtoSignalEnum[] = matchRtoSignals(
        {
          cancelledAt: node.cancelledAt,
          financialStatus: node.displayFinancialStatus,
          tags: node.tags,
          note: node.note,
        },
        store.rtoSignals,
        store.rtoTags,
        store.rtoNoteKeywords,
      );

      if (matched.length > 0) {
        result.push({
          node,
          shopifyOrderId: this.gidToId(node.id),
          matchedSignals: matched,
        });
      }
    }
    return result;
  }

  /**
   * Runs a Shopify Bulk Operation that exports orders in the date range, polls
   * to completion, then downloads and parses the JSONL result.
   */
  private async runBulkScan(
    session: Session,
    dateRangeDays: number,
  ): Promise<BulkOrderNode[]> {
    const since = new Date(Date.now() - dateRangeDays * 86400000)
      .toISOString()
      .slice(0, 10);

    const innerQuery = `{
      orders(query: "created_at:>=${since}") {
        edges { node {
          id name createdAt cancelledAt displayFinancialStatus displayFulfillmentStatus tags note
          totalPriceSet { shopMoney { amount currencyCode } }
          customer { firstName lastName phone }
          shippingAddress { phone name }
          billingAddress { phone }
        } }
      }
    }`;

    await this.shopifyService.graphql(
      session,
      `mutation bulkRun($query: String!) {
        bulkOperationRunQuery(query: $query) {
          bulkOperation { id status }
          userErrors { field message }
        }
      }`,
      { query: innerQuery },
    );

    const url = await this.pollBulkOperation(session);
    if (!url) return []; // completed with no rows (or no data)
    return this.downloadJsonl(url);
  }

  private async pollBulkOperation(session: Session): Promise<string | null> {
    for (let attempt = 0; attempt < this.POLL_ATTEMPTS; attempt++) {
      const data = await this.shopifyService.graphql<{
        currentBulkOperation: {
          status: string;
          url: string | null;
          errorCode: string | null;
        } | null;
      }>(
        session,
        `query { currentBulkOperation { status url errorCode } }`,
      );

      const op = data.currentBulkOperation;
      if (!op) return null;
      if (op.status === 'COMPLETED') return op.url;
      if (['FAILED', 'CANCELED', 'EXPIRED'].includes(op.status)) {
        throw new BusinessRuleFailureException(
          `Bulk scan ${op.status}${op.errorCode ? `: ${op.errorCode}` : ''}`,
          'BULK_SCAN_FAILED',
        );
      }
      await this.sleep(this.POLL_DELAY_MS);
    }
    throw new BusinessRuleFailureException(
      'Bulk scan timed out — please try a smaller date range',
      'BULK_SCAN_TIMEOUT',
    );
  }

  private async downloadJsonl(url: string): Promise<BulkOrderNode[]> {
    const response = await firstValueFrom(
      this.httpService.get<string>(url, { responseType: 'text' }),
    );
    return String(response.data)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as BulkOrderNode);
  }

  private async getStoreSession(
    shopDomain: string,
  ): Promise<{ store: StoreEntity; session: Session }> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    const session = this.shopifyService.buildOfflineSession(
      store.shopDomain,
      this.storeService.getDecryptedAccessToken(store),
    );
    return { store, session };
  }

  private assertSignalsConfigured(store: StoreEntity): void {
    if (!store.rtoSignals || store.rtoSignals.length === 0) {
      throw new BusinessRuleFailureException(
        'Select your RTO signals before running a scan',
        'SIGNALS_REQUIRED',
      );
    }
  }

  private extractPhone(node: BulkOrderNode): string | null {
    return (
      node.customer?.phone ||
      node.shippingAddress?.phone ||
      node.billingAddress?.phone ||
      null
    );
  }

  private extractName(node: BulkOrderNode): string | null {
    if (node.customer?.firstName || node.customer?.lastName) {
      return `${node.customer.firstName ?? ''} ${node.customer.lastName ?? ''}`.trim();
    }
    return node.shippingAddress?.name ?? null;
  }

  private gidToId(gid: string): string {
    return gid.split('/').pop() ?? gid;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
