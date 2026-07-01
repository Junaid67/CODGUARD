import { api, unwrap, ApiSuccess } from '../lib/api';
import { BillingStatus, Plan } from '../types/billing';

export async function getCurrentBilling(): Promise<BillingStatus> {
  const res = await api.get<ApiSuccess<BillingStatus>>('/billing');
  return unwrap(res.data);
}

export async function subscribe(plan: Plan): Promise<BillingStatus> {
  const res = await api.post<ApiSuccess<BillingStatus>>('/billing/subscribe', { plan });
  return unwrap(res.data);
}
