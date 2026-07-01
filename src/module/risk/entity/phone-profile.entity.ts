import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/entity';
import { RiskLevelEnum } from '../../../shared/enums';

/**
 * The shared, cross-store risk database keyed by phone number.
 * NEVER stores raw phone numbers — only a deterministic HMAC hash (for
 * lookups) and an AES-256-GCM encrypted copy (for display to the owning store).
 */
@Entity('phone_profiles')
export class PhoneProfileEntity extends BaseEntity {
  @Column({ name: 'phone_hash', unique: true, length: 64 })
  phoneHash: string; // SHA-256 HMAC — used for lookups

  @Column({ name: 'phone_encrypted', type: 'text' })
  phoneEncrypted: string; // AES-256-GCM — display only, to owning store

  @Column({ name: 'total_orders', default: 0 })
  totalOrders: number;

  @Column({ name: 'delivered_count', default: 0 })
  deliveredCount: number;

  @Column({ name: 'rto_count', default: 0 })
  rtoCount: number;

  @Column({
    name: 'delivery_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  deliveryRate: number; // recalculated on every update

  @Column({ name: 'contributing_store_count', default: 0 })
  contributingStoreCount: number; // how many stores have data on this number

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: RiskLevelEnum,
    default: RiskLevelEnum.UNKNOWN,
  })
  riskLevel: RiskLevelEnum;
}
