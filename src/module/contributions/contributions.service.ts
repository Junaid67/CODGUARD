import { Injectable, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ContributionsRepository } from './contributions.repository';
import { StoreRtoContributionEntity } from './entity/store-rto-contribution.entity';
import { OrderOutcomeEnum } from '../../shared/enums';

export interface RecordContributionInput {
  shopDomain: string;
  phoneHash: string;
  outcome: OrderOutcomeEnum;
  shopifyOrderId: string;
}

/**
 * Tracks which store contributed which outcome for which phone — the basis for
 * cross-store data isolation. No method ever returns another store's raw rows;
 * callers get only booleans/aggregate counts.
 */
@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name);

  constructor(
    private readonly contributionsRepository: ContributionsRepository,
  ) {}

  /**
   * Records a store's outcome contribution. Returns the saved row, or null if
   * it was a duplicate (same shop + order) — the DB unique constraint is the
   * source of truth, so concurrent duplicate webhooks can't double-count.
   */
  async record(
    input: RecordContributionInput,
  ): Promise<StoreRtoContributionEntity | null> {
    const entity = this.contributionsRepository.create({
      shopDomain: input.shopDomain,
      phoneHash: input.phoneHash,
      outcome: input.outcome,
      shopifyOrderId: input.shopifyOrderId,
      contributedAt: new Date(),
    });

    try {
      return await this.contributionsRepository.save(entity);
    } catch (err) {
      // Unique violation on (shop_domain, shopify_order_id) → already counted.
      if (this.isUniqueViolation(err)) {
        this.logger.debug(
          `Duplicate contribution ignored for order ${input.shopifyOrderId}`,
        );
        return null;
      }
      throw err;
    }
  }

  existsForStore(shopDomain: string, phoneHash: string): Promise<boolean> {
    return this.contributionsRepository.existsForStore(shopDomain, phoneHash);
  }

  existsForOrder(shopDomain: string, shopifyOrderId: string): Promise<boolean> {
    return this.contributionsRepository.existsForOrder(
      shopDomain,
      shopifyOrderId,
    );
  }

  countContributingStores(phoneHash: string): Promise<number> {
    return this.contributionsRepository.countDistinctStoresForPhone(phoneHash);
  }

  private isUniqueViolation(err: unknown): boolean {
    return (
      err instanceof QueryFailedError &&
      (err as QueryFailedError & { code?: string }).code === '23505'
    );
  }
}
