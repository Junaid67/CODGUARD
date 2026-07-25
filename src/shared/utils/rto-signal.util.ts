import { RtoSignalEnum } from '../enums';

/**
 * Normalized order state used for signal matching. Both webhook payloads
 * (REST, snake_case) and scan/reconciliation results (GraphQL) are mapped
 * into this shape so RTO/delivered detection lives in exactly one place.
 */
export interface RtoSignalMatchInput {
  cancelledAt?: string | Date | null;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  tags?: string[] | null;
  note?: string | null;
  /** True when any fulfillment reports a delivered shipment status. */
  shipmentDelivered?: boolean;
}

const REFUNDED_STATUSES = ['REFUNDED', 'PARTIALLY_REFUNDED'];

/**
 * Returns the store-enabled RTO signals that the given order state matches.
 * Case-insensitive on statuses, tags and note keywords.
 */
export function matchRtoSignals(
  input: RtoSignalMatchInput,
  signals: RtoSignalEnum[] | null | undefined,
  rtoTags: string[] | null | undefined,
  noteKeywords: string[] | null | undefined,
): RtoSignalEnum[] {
  const enabled = signals ?? [];
  const matched: RtoSignalEnum[] = [];

  if (enabled.includes(RtoSignalEnum.CANCELLED) && input.cancelledAt) {
    matched.push(RtoSignalEnum.CANCELLED);
  }

  if (
    enabled.includes(RtoSignalEnum.REFUNDED) &&
    REFUNDED_STATUSES.includes((input.financialStatus ?? '').toUpperCase())
  ) {
    matched.push(RtoSignalEnum.REFUNDED);
  }

  const tagList = (rtoTags ?? []).map((t) => t.toLowerCase());
  if (
    enabled.includes(RtoSignalEnum.TAG) &&
    (input.tags ?? []).some((t) => tagList.includes(t.toLowerCase()))
  ) {
    matched.push(RtoSignalEnum.TAG);
  }

  const note = (input.note ?? '').toLowerCase();
  if (
    enabled.includes(RtoSignalEnum.NOTE) &&
    note.length > 0 &&
    (noteKeywords ?? []).some((k) => k && note.includes(k.toLowerCase()))
  ) {
    matched.push(RtoSignalEnum.NOTE);
  }

  return matched;
}

/**
 * COD delivered heuristic: a shipment explicitly reported delivered, or a
 * fulfilled order whose financial status flipped to PAID — for COD, payment
 * is collected at the doorstep, so paid + fulfilled ≈ delivered. Refunded
 * states never count (REFUNDED !== PAID).
 */
export function isDeliveredState(input: RtoSignalMatchInput): boolean {
  if (input.shipmentDelivered) return true;
  const financial = (input.financialStatus ?? '').toUpperCase();
  const fulfillment = (input.fulfillmentStatus ?? '').toUpperCase();
  return financial === 'PAID' && fulfillment === 'FULFILLED';
}
