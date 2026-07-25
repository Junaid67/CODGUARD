import { Injectable, Logger } from '@nestjs/common';
import { Session } from '@shopify/shopify-api';
import { v4 as uuidv4 } from 'uuid';
import { OrdersRepository } from './orders.repository';
import { OrderRecordEntity } from './entity/order-record.entity';
import { OrdersFilterDto } from './dto/orders-filter.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderStatsResponseDto } from './dto/order-stats-response.dto';
import { EncryptionService } from '../../core/services';
import { RiskService } from '../risk/risk.service';
import { StoreService } from '../store/store.service';
import { ShopifyService } from '../shopify-auth/shopify.service';
import {
  BusinessRuleFailureException,
  NotFoundException,
} from '../../shared/exceptions';
import { PaginatedResponseDto } from '../../shared/dtos';
import { OrderOutcomeEnum, RiskLevelEnum } from '../../shared/enums';
import {
  AppUtil,
  isDeliveredState,
  maskPhone,
  matchRtoSignals,
  normalizePhone,
} from '../../shared/utils';

/** Fields needed to persist/refresh a local order record (from webhook/scan). */
export interface OrderUpsertInput {
  shopDomain: string;
  shopifyOrderId: string;
  orderNumber: string;
  customerName?: string | null;
  phoneHash?: string | null;
  phoneEncrypted?: string | null;
  email?: string | null;
  riskLevel: RiskLevelEnum;
  deliveryRateAtOrderTime?: number | null;
  outcome?: OrderOutcomeEnum;
  shopifyTags?: string[];
  shopifyFinancialStatus?: string | null;
  shopifyFulfillmentStatus?: string | null;
  orderTotal?: number | null;
  currency?: string | null;
  shopifyCreatedAt?: Date | null;
}

/**
 * Normalized "current state" of a Shopify order, used by orders/updated
 * webhooks and the reconciliation job to refresh the local record and detect
 * outcomes. Shapes from REST webhooks and GraphQL both map into this.
 */
export interface OrderStateSnapshot {
  shopifyOrderId: string;
  orderNumber?: string | null;
  customerName?: string | null;
  phoneRaw?: string | null;
  email?: string | null;
  tags?: string[];
  note?: string | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  cancelledAt?: string | null;
  shipmentDelivered?: boolean;
  orderTotal?: number | null;
  currency?: string | null;
  shopifyCreatedAt?: Date | null;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly encryptionService: EncryptionService,
    private readonly riskService: RiskService,
    private readonly storeService: StoreService,
    private readonly shopifyService: ShopifyService,
  ) {}

  /** Creates or updates the local order record (idempotent per shop+order). */
  async upsert(input: OrderUpsertInput): Promise<OrderRecordEntity> {
    let record = await this.ordersRepository.findByShopAndOrderId(
      input.shopDomain,
      input.shopifyOrderId,
    );

    if (!record) {
      record = this.ordersRepository.create({
        shopDomain: input.shopDomain,
        shopifyOrderId: input.shopifyOrderId,
      });
    }

    record.orderNumber = input.orderNumber;
    record.customerName = input.customerName ?? record.customerName;
    record.phoneHash = input.phoneHash ?? record.phoneHash;
    record.phoneEncrypted = input.phoneEncrypted ?? record.phoneEncrypted;
    record.email = input.email ?? record.email;
    record.riskLevel = input.riskLevel;
    record.deliveryRateAtOrderTime =
      input.deliveryRateAtOrderTime ?? record.deliveryRateAtOrderTime;
    if (input.outcome) record.outcome = input.outcome;
    record.shopifyTags = input.shopifyTags ?? record.shopifyTags;
    record.shopifyFinancialStatus =
      input.shopifyFinancialStatus ?? record.shopifyFinancialStatus;
    record.shopifyFulfillmentStatus =
      input.shopifyFulfillmentStatus ?? record.shopifyFulfillmentStatus;
    record.orderTotal = input.orderTotal ?? record.orderTotal;
    record.currency = input.currency ?? record.currency;
    record.shopifyCreatedAt = input.shopifyCreatedAt ?? record.shopifyCreatedAt;

    return this.ordersRepository.save(record);
  }

  /** Sets the outcome on an existing order record (no-op if not found). */
  async updateOutcome(
    shopDomain: string,
    shopifyOrderId: string,
    outcome: OrderOutcomeEnum,
  ): Promise<void> {
    await this.ordersRepository.update(
      { shopDomain, shopifyOrderId },
      { outcome },
    );
  }

  /**
   * Records an outcome for an order identified by its Shopify order id (used by
   * the cancelled/refund webhooks). Returns false if no local record exists.
   */
  async applyOutcomeByShopifyOrderId(
    shopDomain: string,
    shopifyOrderId: string,
    outcome: OrderOutcomeEnum,
  ): Promise<boolean> {
    const record = await this.ordersRepository.findByShopAndOrderId(
      shopDomain,
      shopifyOrderId,
    );
    if (!record) return false;
    await this.applyOutcomeToRecord(shopDomain, record, outcome);
    return true;
  }

  /**
   * Syncs an order's current Shopify state into the local record and detects
   * its delivery outcome (§6–§8): refreshes tags/note/statuses, applies the
   * store's RTO signals, and — for still-PENDING orders — records RTO or
   * DELIVERED into the shared phone profile. Idempotent: an order whose
   * outcome is already decided is only refreshed, never re-recorded.
   */
  async syncOrderState(
    shopDomain: string,
    snapshot: OrderStateSnapshot,
  ): Promise<void> {
    const store = await this.storeService.findByDomain(shopDomain);
    if (!store) return;

    let record = await this.ordersRepository.findByShopAndOrderId(
      shopDomain,
      snapshot.shopifyOrderId,
    );

    if (!record) {
      // First sight of this order (missed orders/create or pre-install order):
      // score the phone and create the record now.
      const normalized = snapshot.phoneRaw ? normalizePhone(snapshot.phoneRaw) : null;
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
      }

      record = await this.upsert({
        shopDomain,
        shopifyOrderId: snapshot.shopifyOrderId,
        orderNumber: snapshot.orderNumber ?? snapshot.shopifyOrderId,
        customerName: snapshot.customerName,
        phoneHash,
        phoneEncrypted,
        email: snapshot.email,
        riskLevel,
        deliveryRateAtOrderTime: deliveryRate,
        outcome: OrderOutcomeEnum.PENDING,
        shopifyTags: snapshot.tags ?? [],
        shopifyFinancialStatus: snapshot.financialStatus,
        shopifyFulfillmentStatus: snapshot.fulfillmentStatus,
        orderTotal: snapshot.orderTotal,
        currency: snapshot.currency,
        shopifyCreatedAt: snapshot.shopifyCreatedAt,
      });
    } else {
      // Refresh the mutable Shopify state on the existing record.
      record.shopifyTags = snapshot.tags ?? record.shopifyTags;
      record.shopifyFinancialStatus =
        snapshot.financialStatus ?? record.shopifyFinancialStatus;
      record.shopifyFulfillmentStatus =
        snapshot.fulfillmentStatus ?? record.shopifyFulfillmentStatus;
      record = await this.ordersRepository.save(record);
    }

    // Outcomes are only decided once — manual/webhook decisions stand.
    if (record.outcome !== OrderOutcomeEnum.PENDING) return;

    const matched = matchRtoSignals(
      {
        cancelledAt: snapshot.cancelledAt,
        financialStatus: snapshot.financialStatus,
        tags: snapshot.tags,
        note: snapshot.note,
      },
      store.rtoSignals,
      store.rtoTags,
      store.rtoNoteKeywords,
    );

    if (matched.length > 0) {
      await this.applyOutcomeToRecord(shopDomain, record, OrderOutcomeEnum.RTO);
      this.logger.log(
        `Order ${snapshot.shopifyOrderId} (${shopDomain}) → RTO via ${matched.join(',')}`,
      );
    } else if (
      isDeliveredState({
        financialStatus: snapshot.financialStatus,
        fulfillmentStatus: snapshot.fulfillmentStatus,
        shipmentDelivered: snapshot.shipmentDelivered,
      })
    ) {
      await this.applyOutcomeToRecord(
        shopDomain,
        record,
        OrderOutcomeEnum.DELIVERED,
      );
      this.logger.log(
        `Order ${snapshot.shopifyOrderId} (${shopDomain}) → DELIVERED`,
      );
    }
  }

  /** Tags an order with the given risk level (best-effort; errors logged). */
  async tagOrderRisk(
    shopDomain: string,
    shopifyOrderId: string,
    riskLevel: RiskLevelEnum,
  ): Promise<void> {
    try {
      const session = await this.getSession(shopDomain);
      await this.shopifyService.setRiskTag(session, shopifyOrderId, riskLevel);
    } catch (err) {
      this.logger.warn(
        `Tagging failed for order ${shopifyOrderId}: ${(err as Error).message}`,
      );
    }
  }

  /** Soft-deletes all of a store's order records (on app uninstall). */
  async softDeleteByShop(shopDomain: string): Promise<void> {
    await this.ordersRepository.softDelete({ shopDomain });
  }

  /** Paginated, filtered dashboard listing (§12 method 3). */
  async list(
    shopDomain: string,
    filter: OrdersFilterDto,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    this.logger.debug(`list: shop=${shopDomain} page=${filter.page} limit=${filter.limit} risk=${filter.riskLevel ?? '*'} outcome=${filter.outcome ?? '*'}`);
    const [records, total] = await this.ordersRepository.findForDashboard(
      shopDomain,
      filter,
    );
    return new PaginatedResponseDto(
      records.map((r) => this.toResponseDto(r)),
      total,
      filter.page,
      filter.limit,
    );
  }

  /** Dashboard overview metrics (§11). */
  async getStats(shopDomain: string): Promise<OrderStatsResponseDto> {
    const stats = await this.ordersRepository.getStats(shopDomain);
    const decided = stats.delivered + stats.rto;

    return {
      ...stats,
      acceptanceRate:
        decided > 0 ? AppUtil.round2((stats.delivered / decided) * 100) : null,
      rejectionRate:
        decided > 0 ? AppUtil.round2((stats.rto / decided) * 100) : null,
      estimatedRtoLossPrevented: AppUtil.round2(stats.rtoLossPrevented),
    };
  }

  /** Manually mark an order RTO: record the outcome, persist, and re-tag. */
  async markRto(shopDomain: string, recordId: string): Promise<OrderResponseDto> {
    return this.applyManualOutcome(shopDomain, recordId, OrderOutcomeEnum.RTO);
  }

  /** Manually mark an order delivered. */
  async markDelivered(
    shopDomain: string,
    recordId: string,
  ): Promise<OrderResponseDto> {
    return this.applyManualOutcome(shopDomain, recordId, OrderOutcomeEnum.DELIVERED);
  }

  /** Bulk-apply an outcome to multiple records (store-scoped). */
  async bulkMark(
    shopDomain: string,
    recordIds: string[],
    outcome: OrderOutcomeEnum,
  ): Promise<{ updated: number }> {
    const records = await this.ordersRepository.findByIdsForShop(
      shopDomain,
      recordIds,
    );
    let updated = 0;
    for (const record of records) {
      await this.applyOutcomeToRecord(shopDomain, record, outcome);
      updated += 1;
    }
    return { updated };
  }

  /**
   * Settings → Manual RTO: flags a phone number as RTO with no real Shopify
   * order behind it. Feeds the shared cross-store profile the same way a
   * real order outcome would (via RiskService.recordOutcome with a synthetic
   * order id), and keeps a local record so it can be listed in Settings.
   */
  async addManualRto(shopDomain: string, phoneRaw: string): Promise<OrderResponseDto> {
    this.logger.log(`addManualRto: shop=${shopDomain}`);
    const normalized = normalizePhone(phoneRaw);
    if (!normalized) {
      throw new BusinessRuleFailureException(
        'Enter a valid Pakistani phone number',
        'INVALID_PHONE',
      );
    }

    const syntheticOrderId = `manual:${uuidv4()}`;
    await this.riskService.recordOutcome(
      normalized,
      OrderOutcomeEnum.RTO,
      shopDomain,
      syntheticOrderId,
    );
    const score = await this.riskService.scorePhone(normalized);

    const record = this.ordersRepository.create({
      shopDomain,
      shopifyOrderId: syntheticOrderId,
      orderNumber: 'MANUAL',
      phoneHash: this.encryptionService.hash(normalized),
      phoneEncrypted: this.encryptionService.encrypt(normalized),
      riskLevel: score.riskLevel,
      deliveryRateAtOrderTime: score.deliveryRate ?? undefined,
      outcome: OrderOutcomeEnum.RTO,
      isManual: true,
      shopifyCreatedAt: new Date(),
    });
    const saved = await this.ordersRepository.save(record);
    return this.toResponseDto(saved);
  }

  /** Lists this store's manually-added RTO entries (Settings page). */
  async listManualRto(shopDomain: string): Promise<OrderResponseDto[]> {
    const records = await this.ordersRepository.findManualForShop(shopDomain);
    return records.map((r) => this.toResponseDto(r));
  }

  /**
   * Removes a manual entry from this store's list only. Does NOT reverse the
   * outcome already recorded into the shared cross-store phone profile — that
   * aggregate isn't retroactively mutable (undoing it would let a merchant
   * game another store's risk signal for the same number).
   */
  async removeManualRto(shopDomain: string, id: string): Promise<void> {
    this.logger.log(`removeManualRto: id=${id} shop=${shopDomain}`);
    const record = await this.ordersRepository.findOne({
      where: { id, shopDomain, isManual: true },
    });
    if (!record) {
      throw new NotFoundException('Manual RTO entry not found');
    }
    await this.ordersRepository.softDelete(record.id);
  }

  private async applyManualOutcome(
    shopDomain: string,
    recordId: string,
    outcome: OrderOutcomeEnum,
  ): Promise<OrderResponseDto> {
    const record = await this.ordersRepository.findOne({
      where: { id: recordId, shopDomain },
    });
    if (!record) {
      throw new NotFoundException('Order not found');
    }
    const updated = await this.applyOutcomeToRecord(shopDomain, record, outcome);
    return this.toResponseDto(updated);
  }

  /**
   * Records the outcome into the shared profile (decrypting the stored phone),
   * updates the local record, and re-tags the order with the customer's now
   * up-to-date risk level.
   */
  private async applyOutcomeToRecord(
    shopDomain: string,
    record: OrderRecordEntity,
    outcome: OrderOutcomeEnum,
  ): Promise<OrderRecordEntity> {
    if (record.phoneEncrypted) {
      const phone = this.encryptionService.decrypt(record.phoneEncrypted);
      await this.riskService.recordOutcome(
        phone,
        outcome,
        shopDomain,
        record.shopifyOrderId,
      );

      // Re-score and re-tag with the updated risk level.
      const score = await this.riskService.scorePhone(phone);
      record.riskLevel = score.riskLevel;
      try {
        const session = await this.getSession(shopDomain);
        await this.shopifyService.setRiskTag(
          session,
          record.shopifyOrderId,
          score.riskLevel,
        );
      } catch (err) {
        this.logger.warn(
          `Re-tagging failed for order ${record.shopifyOrderId}: ${(err as Error).message}`,
        );
      }
    }

    record.outcome = outcome;
    return this.ordersRepository.save(record);
  }

  private async getSession(shopDomain: string): Promise<Session> {
    const store = await this.storeService.findByDomainOrThrow(shopDomain);
    return this.shopifyService.buildOfflineSession(
      store.shopDomain,
      this.storeService.getDecryptedAccessToken(store),
    );
  }

  /** Maps an entity to the dashboard DTO, masking the phone. */
  toResponseDto(record: OrderRecordEntity): OrderResponseDto {
    let phoneMasked: string | null = null;
    if (record.phoneEncrypted) {
      try {
        phoneMasked = maskPhone(
          this.encryptionService.decrypt(record.phoneEncrypted),
        );
      } catch {
        phoneMasked = null;
      }
    }

    return {
      id: record.id,
      shopifyOrderId: record.shopifyOrderId,
      orderNumber: record.orderNumber,
      customerName: record.customerName ?? null,
      phoneMasked,
      riskLevel: record.riskLevel,
      deliveryRateAtOrderTime:
        record.deliveryRateAtOrderTime != null
          ? Number(record.deliveryRateAtOrderTime)
          : null,
      outcome: record.outcome,
      orderTotal: record.orderTotal != null ? Number(record.orderTotal) : null,
      currency: record.currency ?? null,
      shopifyFinancialStatus: record.shopifyFinancialStatus ?? null,
      shopifyFulfillmentStatus: record.shopifyFulfillmentStatus ?? null,
      shopifyCreatedAt: record.shopifyCreatedAt ?? null,
    };
  }
}
