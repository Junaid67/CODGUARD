import { RtoSignalEnum } from '../enums';

/**
 * Metadata for each selectable RTO signal — used to render the onboarding
 * signal-selection UI and to gate courier signals behind the PRO plan.
 */
export interface RtoSignalDefinition {
  signal: RtoSignalEnum;
  label: string;
  description: string;
  /** Courier signals require courier integration (PRO plan, Phase 3). */
  isCourier: boolean;
}

export const RTO_SIGNAL_DEFINITIONS: RtoSignalDefinition[] = [
  {
    signal: RtoSignalEnum.CANCELLED,
    label: 'Order cancelled',
    description: 'Treat cancelled orders as RTO',
    isCourier: false,
  },
  {
    signal: RtoSignalEnum.TAG,
    label: 'Order tag',
    description: 'Treat orders with your RTO tags (e.g. rto, returned, wapas) as RTO',
    isCourier: false,
  },
  {
    signal: RtoSignalEnum.NOTE,
    label: 'Order note text',
    description:
      'Treat orders whose note contains your keywords (e.g. refused, rto, wapas) as RTO',
    isCourier: false,
  },
  {
    signal: RtoSignalEnum.REFUNDED,
    label: 'Order refunded',
    description: 'Treat refunded orders as RTO',
    isCourier: false,
  },
  {
    signal: RtoSignalEnum.MANUAL,
    label: 'Manual marking',
    description: 'RTO marked manually by you in the dashboard',
    isCourier: false,
  },
  {
    signal: RtoSignalEnum.COURIER_LEOPARDS,
    label: 'Leopards courier',
    description: 'Auto-detect RTO from Leopards courier status (PRO)',
    isCourier: true,
  },
  {
    signal: RtoSignalEnum.COURIER_TCS,
    label: 'TCS courier',
    description: 'Auto-detect RTO from TCS courier status (PRO)',
    isCourier: true,
  },
  {
    signal: RtoSignalEnum.COURIER_MNP,
    label: 'M&P courier',
    description: 'Auto-detect RTO from M&P courier status (PRO)',
    isCourier: true,
  },
  {
    signal: RtoSignalEnum.COURIER_POSTEX,
    label: 'PostEx courier',
    description: 'Auto-detect RTO from PostEx courier status (PRO)',
    isCourier: true,
  },
];

/** Signals available without courier integration (non-PRO plans). */
export const NON_COURIER_SIGNALS = RTO_SIGNAL_DEFINITIONS.filter(
  (s) => !s.isCourier,
).map((s) => s.signal);
