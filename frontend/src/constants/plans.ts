import { Plan } from '../types/billing';

export const FREE_TRIAL_DAYS = 14;

export interface PlanDefinition {
  plan: Plan;
  name: string;
  priceUsd: number;
  monthlyOrders: number | null; // null = unlimited
  features: string[];
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    plan: Plan.FREE,
    name: 'Free',
    priceUsd: 0,
    monthlyOrders: 50,
    features: ['Up to 50 orders / month', 'Local risk scoring', 'Manual RTO marking'],
  },
  {
    plan: Plan.STARTER,
    name: 'Starter',
    priceUsd: 3,
    monthlyOrders: 500,
    features: [
      'Up to 500 orders / month',
      'Cross-store shared risk data',
      'Bulk CSV import',
      'Auto tag detection',
    ],
  },
  {
    plan: Plan.GROWTH,
    name: 'Growth',
    priceUsd: 7,
    monthlyOrders: 2000,
    features: [
      'Up to 2,000 orders / month',
      'Cross-store shared risk data',
      'Bulk CSV import',
      'Auto tag detection',
      'Full analytics dashboard',
      'WhatsApp confirmation trigger',
      'Re-scan historical orders',
    ],
  },
  {
    plan: Plan.PRO,
    name: 'Pro',
    priceUsd: 15,
    monthlyOrders: null,
    features: [
      'Unlimited orders',
      'Cross-store shared risk data',
      'Bulk CSV import',
      'Auto tag detection',
      'Full analytics dashboard',
      'WhatsApp confirmation trigger',
      'Re-scan historical orders',
      'Courier integration (Leopards, TCS, M&P, PostEx)',
    ],
  },
];
