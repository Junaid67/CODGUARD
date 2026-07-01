import { PlanEnum } from '../enums';

/**
 * Plan order limits + pricing (§6). monthlyOrders is the cap enforced by
 * PlanLimitGuard; PRO is unlimited.
 */
export const PLAN_LIMITS: Record<
  PlanEnum,
  { monthlyOrders: number; priceUsd: number }
> = {
  [PlanEnum.FREE]: { monthlyOrders: 50, priceUsd: 0 },
  [PlanEnum.STARTER]: { monthlyOrders: 500, priceUsd: 3 },
  [PlanEnum.GROWTH]: { monthlyOrders: 2000, priceUsd: 7 },
  [PlanEnum.PRO]: { monthlyOrders: Infinity, priceUsd: 15 },
};

export interface PlanFeatures {
  crossStoreData: boolean;
  bulkCsvImport: boolean;
  autoTagDetection: boolean;
  fullDashboard: boolean;
  whatsappTrigger: boolean;
  rescan: boolean;
  courierIntegration: boolean;
}

export const PLAN_FEATURES: Record<PlanEnum, PlanFeatures> = {
  [PlanEnum.FREE]: {
    crossStoreData: false,
    bulkCsvImport: false,
    autoTagDetection: false,
    fullDashboard: false,
    whatsappTrigger: false,
    rescan: false,
    courierIntegration: false,
  },
  [PlanEnum.STARTER]: {
    crossStoreData: true,
    bulkCsvImport: true,
    autoTagDetection: true,
    fullDashboard: false,
    whatsappTrigger: false,
    rescan: false,
    courierIntegration: false,
  },
  [PlanEnum.GROWTH]: {
    crossStoreData: true,
    bulkCsvImport: true,
    autoTagDetection: true,
    fullDashboard: true,
    whatsappTrigger: true,
    rescan: true,
    courierIntegration: false,
  },
  [PlanEnum.PRO]: {
    crossStoreData: true,
    bulkCsvImport: true,
    autoTagDetection: true,
    fullDashboard: true,
    whatsappTrigger: true,
    rescan: true,
    courierIntegration: true, // Leopards, TCS, M&P (Phase 3)
  },
};

export const FREE_TRIAL_DAYS = 14;
