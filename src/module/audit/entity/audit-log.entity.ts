import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditStatusEnum } from '../../../shared/enums';

/**
 * Append-only audit trail. No soft delete — records are never modified or
 * removed. Every significant action is logged here, on BOTH success and
 * failure, with full context: who (actor), which store, from where (IP /
 * user-agent), the correlation requestId, timing, and any error.
 */
@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'shop_domain', length: 255 })
  shopDomain: string;

  @Column({ name: 'action', length: 100 })
  action: string; // 'RTO_MARKED', 'SCAN_RUN', 'TERMS_ACCEPTED', etc.

  @Index()
  @Column({
    name: 'status',
    type: 'enum',
    enum: AuditStatusEnum,
    default: AuditStatusEnum.SUCCESS,
  })
  status: AuditStatusEnum;

  /**
   * Who performed the action — the Shopify user id/email from the session when
   * known, or a system marker (e.g. 'webhook', 'system') for non-interactive
   * actions.
   */
  @Column({ name: 'actor', length: 255, nullable: true })
  actor: string;

  @Column({ name: 'request_id', length: 64, nullable: true })
  requestId: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', length: 512, nullable: true })
  userAgent: string;

  /** Populated for FAILED records (never contains raw secrets/phones). */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  /** Duration of the audited handler in milliseconds, when measured. */
  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs: number;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
