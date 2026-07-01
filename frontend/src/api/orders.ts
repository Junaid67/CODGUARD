import { api, unwrap, ApiSuccess } from '../lib/api';
import { OrderRecord, OrdersFilter, PaginatedResponse } from '../types/order';

function cleanParams(filter: OrdersFilter): Record<string, string | number> {
  const params: Record<string, string | number> = { page: filter.page, limit: filter.limit };
  if (filter.riskLevel) params.riskLevel = filter.riskLevel;
  if (filter.outcome) params.outcome = filter.outcome;
  if (filter.dateFrom) params.dateFrom = filter.dateFrom;
  if (filter.dateTo) params.dateTo = filter.dateTo;
  if (filter.search) params.search = filter.search;
  return params;
}

export async function listOrders(
  filter: OrdersFilter,
): Promise<PaginatedResponse<OrderRecord>> {
  const res = await api.get<ApiSuccess<PaginatedResponse<OrderRecord>>>('/orders', {
    params: cleanParams(filter),
  });
  return unwrap(res.data);
}

export async function bulkMarkRto(orderIds: string[]): Promise<{ updated: number }> {
  const res = await api.post<ApiSuccess<{ updated: number }>>('/orders/bulk/rto', {
    orderIds,
  });
  return unwrap(res.data);
}

export async function bulkMarkDelivered(orderIds: string[]): Promise<{ updated: number }> {
  const res = await api.post<ApiSuccess<{ updated: number }>>('/orders/bulk/delivered', {
    orderIds,
  });
  return unwrap(res.data);
}

export async function listManualRto(): Promise<OrderRecord[]> {
  const res = await api.get<ApiSuccess<OrderRecord[]>>('/orders/manual');
  return unwrap(res.data);
}

export async function addManualRto(phone: string): Promise<OrderRecord> {
  const res = await api.post<ApiSuccess<OrderRecord>>('/orders/manual', { phone });
  return unwrap(res.data);
}

export async function removeManualRto(id: string): Promise<void> {
  await api.delete(`/orders/manual/${id}`);
}
