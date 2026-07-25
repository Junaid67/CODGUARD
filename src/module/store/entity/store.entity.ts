import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/entity';
import { PlanEnum, RtoSignalEnum } from '../../../shared/enums';

/**
 * A Shopify store using the app. The access token is AES-256 encrypted at rest.
 */
@Entity('stores')
export class StoreEntity extends BaseEntity {
  @Column({ name: 'shop_domain', unique: true, length: 255 })
  shopDomain: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string; // AES-256 encrypted at rest

  @Column({ type: 'enum', enum: PlanEnum, default: PlanEnum.FREE })
  plan: PlanEnum;

  @Column({ name: 'billing_id', nullable: true, length: 255 })
  billingId: string;

  @Column({ name: 'rto_signals', type: 'jsonb', nullable: true })
  rtoSignals: RtoSignalEnum[]; // e.g. ['CANCELLED', 'TAG', 'REFUNDED']

  @Column({ name: 'rto_tags', type: 'text', array: true, nullable: true })
  rtoTags: string[]; // e.g. ['rto', 'returned', 'wapas']

  @Column({ name: 'rto_note_keywords', type: 'text', array: true, nullable: true })
  rtoNoteKeywords: string[]; // e.g. ['refused', 'customer denied', 'wapas']

  @Column({ name: 'onboarding_complete', default: false })
  onboardingComplete: boolean;

  @Column({ name: 'terms_accepted', default: false })
  termsAccepted: boolean;

  @Column({ name: 'terms_accepted_at', type: 'timestamptz', nullable: true })
  termsAcceptedAt: Date;

  @Column({ name: 'monthly_order_count', default: 0 })
  monthlyOrderCount: number;

  @Column({ name: 'monthly_count_reset_at', type: 'timestamptz', nullable: true })
  monthlyCountResetAt: Date;

  @Column({ name: 'last_scan_at', type: 'timestamptz', nullable: true })
  lastScanAt: Date;

  @Column({ name: 'total_orders_scanned', default: 0 })
  totalOrdersScanned: number;
}
