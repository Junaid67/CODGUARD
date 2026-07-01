import { RtoSignal } from './rtoSignal';

export interface PlanFeatures {
  crossStoreData: boolean;
  bulkCsvImport: boolean;
  autoTagDetection: boolean;
  fullDashboard: boolean;
  whatsappTrigger: boolean;
  rescan: boolean;
  courierIntegration: boolean;
}

export interface StoreSettings {
  shopDomain: string;
  plan: 'free' | 'starter' | 'growth' | 'pro';
  rtoSignals: RtoSignal[];
  rtoTags: string[];
  onboardingComplete: boolean;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  monthlyOrderCount: number;
  lastScanAt: string | null;
  totalOrdersScanned: number;
  monthlyOrderLimit: number | null;
  features: PlanFeatures;
}
