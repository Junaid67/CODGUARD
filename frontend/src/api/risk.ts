import { api, unwrap, ApiSuccess } from '../lib/api';
import { RiskScore } from '../types/order';

/** Customer intelligence — check a phone number's cross-store reputation. */
export async function scorePhone(phone: string): Promise<RiskScore> {
  const res = await api.post<ApiSuccess<RiskScore>>('/risk/score', { phone });
  return unwrap(res.data);
}
