export enum Plan {
  FREE = 'free',
  STARTER = 'starter',
  GROWTH = 'growth',
  PRO = 'pro',
}

export interface BillingStatus {
  plan: Plan;
  status: string;
  trialEndsAt: string | null;
  billingOn: string | null;
  confirmationUrl?: string | null;
}
