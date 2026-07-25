import { RtoSignal } from './rtoSignal';

export enum OnboardingStep {
  SIGNALS = 'SIGNALS',
  SCAN_PREVIEW = 'SCAN_PREVIEW',
  TERMS = 'TERMS',
  CONFIRM_SCAN = 'CONFIRM_SCAN',
  COMPLETE = 'COMPLETE',
}

export interface OnboardingStatus {
  onboardingComplete: boolean;
  hasSignals: boolean;
  signalsCount: number;
  tagsCount: number;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  lastScanAt: string | null;
  totalOrdersScanned: number;
  nextStep: OnboardingStep;
}

export interface SaveRtoSignalsPayload {
  signals: RtoSignal[];
  tags?: string[];
  noteKeywords?: string[];
}

export interface AcceptTermsPayload {
  confirmed: boolean;
  signalsAccurate: boolean;
}

export interface ScanPreviewItem {
  shopifyOrderId: string;
  orderNumber: string;
  customerName: string | null;
  phoneMasked: string | null;
  matchedSignals: RtoSignal[];
  orderTotal: number | null;
  currency: string | null;
  createdAt: string | null;
}

export interface ScanPreviewResponse {
  dateRangeDays: number;
  totalOrdersScanned: number;
  probableRtoCount: number;
  items: ScanPreviewItem[];
}

export interface ConfirmScanResponse {
  totalScanned: number;
  rtoProcessed: number;
  excluded: number;
  onboardingComplete: boolean;
}
