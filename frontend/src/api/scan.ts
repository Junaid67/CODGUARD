import { api, unwrap, ApiSuccess } from '../lib/api';
import { ConfirmScanResponse, ScanPreviewResponse } from '../types/onboarding';

export async function previewScan(dateRangeDays: number): Promise<ScanPreviewResponse> {
  const res = await api.post<ApiSuccess<ScanPreviewResponse>>('/scan/preview', {
    dateRangeDays,
  });
  return unwrap(res.data);
}

export async function confirmScan(
  excludedOrderIds: string[],
  dateRangeDays: number,
): Promise<ConfirmScanResponse> {
  const res = await api.post<ApiSuccess<ConfirmScanResponse>>('/scan/confirm', {
    excludedOrderIds,
    dateRangeDays,
  });
  return unwrap(res.data);
}

export interface RescanResponse {
  totalScanned: number;
  rtoProcessed: number;
}

export async function rescan(dateRangeDays: number): Promise<RescanResponse> {
  const res = await api.post<ApiSuccess<RescanResponse>>('/scan/rescan', {
    dateRangeDays,
  });
  return unwrap(res.data);
}
