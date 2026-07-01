import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../core/entity';
import { OrderOutcomeEnum } from '../../../shared/enums';

/**
 * Tracks which store contributed which outcome for which phone. Keeps store
 * data isolated — no store can see another store's raw data. The unique
 * constraint prevents a store double-counting the same order.
 */
@Entity('store_rto_contributions')
@Unique(['shopDomain', 'shopifyOrderId']) // prevent duplicate contributions
export class StoreRtoContributionEntity extends BaseEntity {
  @Index()
  @Column({ name: 'shop_domain', length: 255 })
  shopDomain: string;

  @Index()
  @Column({ name: 'phone_hash', length: 64 })
  phoneHash: string;

  @Column({ name: 'outcome', type: 'enum', enum: OrderOutcomeEnum })
  outcome: OrderOutcomeEnum; // DELIVERED or RTO

  @Column({ name: 'shopify_order_id', length: 100 })
  shopifyOrderId: string;

  @Column({ name: 'contributed_at', type: 'timestamptz' })
  contributedAt: Date;
}
