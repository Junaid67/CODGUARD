import { RiskLevel } from '../types/order';

/** Polaris Badge `tone` per risk level — green/yellow/red/grey (§12). */
export const RISK_BADGE_TONE: Record<RiskLevel, 'success' | 'warning' | 'critical' | undefined> = {
  [RiskLevel.LOW]: 'success',
  [RiskLevel.MEDIUM]: 'warning',
  [RiskLevel.HIGH]: 'critical',
  [RiskLevel.UNKNOWN]: undefined, // neutral/grey
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Low',
  [RiskLevel.MEDIUM]: 'Medium',
  [RiskLevel.HIGH]: 'High',
  [RiskLevel.UNKNOWN]: 'Unknown',
};

export const RISK_RECOMMENDATION: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Ship normally',
  [RiskLevel.MEDIUM]: 'Confirm before shipping',
  [RiskLevel.HIGH]: 'Request advance payment',
  [RiskLevel.UNKNOWN]: 'New customer — ship with caution',
};
