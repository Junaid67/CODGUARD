import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { AuditLogEntity } from './entity/audit-log.entity';
import { AuditStatusEnum } from '../../shared/enums';
import { LogUtil } from '../../shared/utils';

/**
 * Request-derived context for an audit entry. Extracted from the Express
 * request by buildContext() so callers don't have to dig it out themselves.
 */
export interface AuditContext {
  shopDomain?: string;
  actor?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogInput extends AuditContext {
  action: string;
  status?: AuditStatusEnum;
  errorMessage?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Writes append-only audit records. Captures every significant action — on
 * success AND failure — with who/where/when context. Sensitive values in
 * metadata are redacted before persisting. Audit writes never throw into the
 * caller: a failure to log is logged but swallowed so it can't break the
 * audited operation.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepository: Repository<AuditLogEntity>,
  ) {}

  /** Extracts audit context from an Express request (actor, ip, ua, requestId). */
  static buildContext(req: Request): AuditContext {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim() ||
      req.ip ||
      req.socket?.remoteAddress;
    const ua = req.headers['user-agent'];
    return {
      shopDomain: req.shopDomain,
      actor: req.shopifyUserId,
      requestId: req.requestId,
      ipAddress: ip,
      userAgent: Array.isArray(ua) ? ua[0] : ua,
    };
  }

  /** Low-level write. Prefer logSuccess/logFailure. */
  async log(input: AuditLogInput): Promise<void> {
    try {
      const record = this.auditRepository.create({
        shopDomain: input.shopDomain ?? 'unknown',
        action: input.action,
        status: input.status ?? AuditStatusEnum.SUCCESS,
        actor: input.actor,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent?.slice(0, 512),
        errorMessage: input.errorMessage?.slice(0, 2000),
        durationMs: input.durationMs,
        metadata: input.metadata ? LogUtil.redact(input.metadata) : undefined,
      });
      await this.auditRepository.save(record);
    } catch (err) {
      // Never let an audit failure break the audited operation.
      this.logger.error(
        `Failed to write audit log for action "${input.action}": ${(err as Error).message}`,
      );
    }
  }

  /** Records a successful action. */
  logSuccess(
    action: string,
    context: AuditContext,
    extra?: { metadata?: Record<string, unknown>; durationMs?: number },
  ): Promise<void> {
    return this.log({
      action,
      status: AuditStatusEnum.SUCCESS,
      ...context,
      metadata: extra?.metadata,
      durationMs: extra?.durationMs,
    });
  }

  /** Records a failed action with the error message. */
  logFailure(
    action: string,
    context: AuditContext,
    error: unknown,
    extra?: { metadata?: Record<string, unknown>; durationMs?: number },
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return this.log({
      action,
      status: AuditStatusEnum.FAILED,
      errorMessage,
      ...context,
      metadata: extra?.metadata,
      durationMs: extra?.durationMs,
    });
  }
}
