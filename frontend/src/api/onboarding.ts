import { api, unwrap, ApiSuccess } from '../lib/api';
import {
  AcceptTermsPayload,
  OnboardingStatus,
  SaveRtoSignalsPayload,
} from '../types/onboarding';

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await api.get<ApiSuccess<OnboardingStatus>>('/onboarding/status');
  return unwrap(res.data);
}

export async function getTagSuggestions(): Promise<string[]> {
  const res = await api.get<ApiSuccess<string[]>>('/onboarding/tags');
  return unwrap(res.data);
}

export async function saveRtoSignals(
  payload: SaveRtoSignalsPayload,
): Promise<OnboardingStatus> {
  const res = await api.post<ApiSuccess<OnboardingStatus>>(
    '/onboarding/signals',
    payload,
  );
  return unwrap(res.data);
}

export async function acceptTerms(
  payload: AcceptTermsPayload,
): Promise<OnboardingStatus> {
  const res = await api.post<ApiSuccess<OnboardingStatus>>(
    '/onboarding/terms/accept',
    payload,
  );
  return unwrap(res.data);
}
