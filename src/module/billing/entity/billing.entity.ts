import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity';
import { PlanEnum } from '../../../shared/enums';

/**
 * Billing/subscription record per store, mirroring the Shopify Billing API
 * subscription state.
 */
@Entity('billing_records')
export class BillingEntity extends BaseEntity {
  @Index()
  @Column({ name: 'shop_domain', length: 255 })
  shopDomain: string;

  @Column({ name: 'shopify_subscription_id', length: 255, nullable: true })
  shopifySubscriptionId: string;

  @Column({ name: 'plan', type: 'enum', enum: PlanEnum })
  plan: PlanEnum;

  @Column({ name: 'status', length: 50 })
  status: string; // 'ACTIVE', 'CANCELLED', 'PENDING'

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @Column({ name: 'billing_on', type: 'timestamptz', nullable: true })
  billingOn: Date;
}
