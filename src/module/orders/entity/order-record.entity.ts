import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity';
import { OrderOutcomeEnum, RiskLevelEnum } from '../../../shared/enums';

/**
 * Local copy of order data for the app dashboard. Only fields needed for risk
 * scoring/display are stored — never full line items. Phone is stored hashed +
 * encrypted, never raw.
 */
@Entity('order_records')
@Index(['shopDomain', 'shopifyOrderId'], { unique: true })
export class OrderRecordEntity extends BaseEntity {
  @Index()
  @Column({ name: 'shop_domain', length: 255 })
  shopDomain: string;

  @Column({ name: 'shopify_order_id', length: 100 })
  shopifyOrderId: string;

  @Column({ name: 'order_number', length: 50 })
  orderNumber: string;

  @Column({ name: 'customer_name', length: 255, nullable: true })
  customerName: string;

  @Index()
  @Column({ name: 'phone_hash', length: 64, nullable: true })
  phoneHash: string;

  @Column({ name: 'phone_encrypted', type: 'text', nullable: true })
  phoneEncrypted: string;

  @Column({ name: 'email', length: 255, nullable: true })
  email: string;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: RiskLevelEnum,
    default: RiskLevelEnum.UNKNOWN,
  })
  riskLevel: RiskLevelEnum;

  @Column({
    name: 'delivery_rate_at_order_time',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  deliveryRateAtOrderTime: number;

  @Column({
    name: 'outcome',
    type: 'enum',
    enum: OrderOutcomeEnum,
    default: OrderOutcomeEnum.PENDING,
  })
  outcome: OrderOutcomeEnum;

  @Column({ name: 'shopify_tags', type: 'text', array: true, nullable: true })
  shopifyTags: string[];

  @Column({ name: 'shopify_financial_status', length: 50, nullable: true })
  shopifyFinancialStatus: string;

  @Column({ name: 'shopify_fulfillment_status', length: 50, nullable: true })
  shopifyFulfillmentStatus: string;

  @Column({
    name: 'order_total',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  orderTotal: number;

  @Column({ name: 'currency', length: 10, nullable: true })
  currency: string;

  @Column({ name: 'shopify_created_at', type: 'timestamptz', nullable: true })
  shopifyCreatedAt: Date;

  /** True for entries created via Settings → Manual RTO (no real Shopify order). */
  @Column({ name: 'is_manual', type: 'boolean', default: false })
  isManual: boolean;
}
