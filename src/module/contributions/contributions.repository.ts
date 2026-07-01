import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StoreRtoContributionEntity } from './entity/store-rto-contribution.entity';

/**
 * Data-access for per-store outcome contributions. Keeps stores isolated — all
 * methods are scoped to a single store or return aggregate-only counts, never
 * another store's rows.
 */
@Injectable()
export class ContributionsRepository extends Repository<StoreRtoContributionEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StoreRtoContributionEntity, dataSource.createEntityManager());
  }

  /** True if this store has already contributed any outcome for this phone. */
  async existsForStore(shopDomain: string, phoneHash: string): Promise<boolean> {
    const count = await this.count({ where: { shopDomain, phoneHash } });
    return count > 0;
  }

  /** True if this store has already contributed this specific order. */
  async existsForOrder(
    shopDomain: string,
    shopifyOrderId: string,
  ): Promise<boolean> {
    const count = await this.count({ where: { shopDomain, shopifyOrderId } });
    return count > 0;
  }

  /** Number of distinct stores that have contributed data for a phone. */
  async countDistinctStoresForPhone(phoneHash: string): Promise<number> {
    const result = await this.createQueryBuilder('c')
      .select('COUNT(DISTINCT c.shop_domain)', 'count')
      .where('c.phone_hash = :phoneHash', { phoneHash })
      .getRawOne<{ count: string }>();
    return result ? parseInt(result.count, 10) : 0;
  }
}
