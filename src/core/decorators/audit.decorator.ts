import { SetMetadata } from '@nestjs/common';
import { METADATA_KEYS } from '../../app.constants';

/**
 * Marks a controller handler for automatic audit logging. The AuditInterceptor
 * records a SUCCESS entry when the handler completes and a FAILED entry (with
 * the error message) when it throws — capturing actor, shop, IP, user-agent,
 * requestId and duration.
 *
 *   @Audit('TERMS_ACCEPTED')
 *   @Post('terms/accept')
 *   acceptTerms(...) { ... }
 *
 * The action string should be a stable UPPER_SNAKE verb
 * (e.g. 'RTO_MARKED', 'SCAN_RUN', 'SETTINGS_UPDATED').
 */
export const Audit = (action: string) =>
  SetMetadata(METADATA_KEYS.AUDIT_ACTION, action);
