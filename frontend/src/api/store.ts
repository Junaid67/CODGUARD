import { api, unwrap, ApiSuccess } from '../lib/api';
import { StoreSettings } from '../types/store';
import { RtoSignal } from '../types/rtoSignal';

export async function getStoreSettings(): Promise<StoreSettings> {
  const res = await api.get<ApiSuccess<StoreSettings>>('/store/settings');
  return unwrap(res.data);
}

export async function updateStoreSettings(
  rtoSignals: RtoSignal[],
  rtoTags: string[],
  rtoNoteKeywords: string[] = [],
): Promise<StoreSettings> {
  const res = await api.put<ApiSuccess<StoreSettings>>('/store/settings', {
    rtoSignals,
    rtoTags,
    rtoNoteKeywords,
  });
  return unwrap(res.data);
}
