export enum RtoSignal {
  CANCELLED = 'CANCELLED',
  TAG = 'TAG',
  NOTE = 'NOTE',
  REFUNDED = 'REFUNDED',
  COURIER_LEOPARDS = 'COURIER_LEOPARDS',
  COURIER_TCS = 'COURIER_TCS',
  COURIER_MNP = 'COURIER_MNP',
  COURIER_POSTEX = 'COURIER_POSTEX',
  MANUAL = 'MANUAL',
}

export interface RtoSignalDefinition {
  signal: RtoSignal;
  label: string;
  description: string;
  isCourier: boolean;
}

/** Mirrors the backend's RTO_SIGNAL_DEFINITIONS (src/shared/constants/rto-signals.constants.ts). */
export const RTO_SIGNAL_DEFINITIONS: RtoSignalDefinition[] = [
  { signal: RtoSignal.CANCELLED, label: 'Order cancelled', description: 'Treat cancelled orders as RTO', isCourier: false },
  { signal: RtoSignal.TAG, label: 'Order tag', description: 'Treat orders with your RTO tags (e.g. rto, returned, wapas) as RTO', isCourier: false },
  { signal: RtoSignal.NOTE, label: 'Order note text', description: 'Treat orders whose note contains your keywords (e.g. refused, rto, wapas) as RTO', isCourier: false },
  { signal: RtoSignal.REFUNDED, label: 'Order refunded', description: 'Treat refunded orders as RTO', isCourier: false },
  { signal: RtoSignal.MANUAL, label: 'Manual marking', description: 'RTO marked manually by you in the dashboard', isCourier: false },
  { signal: RtoSignal.COURIER_LEOPARDS, label: 'Leopards courier', description: 'Auto-detect RTO from Leopards courier status (PRO)', isCourier: true },
  { signal: RtoSignal.COURIER_TCS, label: 'TCS courier', description: 'Auto-detect RTO from TCS courier status (PRO)', isCourier: true },
  { signal: RtoSignal.COURIER_MNP, label: 'M&P courier', description: 'Auto-detect RTO from M&P courier status (PRO)', isCourier: true },
  { signal: RtoSignal.COURIER_POSTEX, label: 'PostEx courier', description: 'Auto-detect RTO from PostEx courier status (PRO)', isCourier: true },
];
