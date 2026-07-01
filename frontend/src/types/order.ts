export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  UNKNOWN = 'unknown',
}

export enum OrderOutcome {
  DELIVERED = 'DELIVERED',
  RTO = 'RTO',
  PENDING = 'PENDING',
}

export interface OrderRecord {
  id: string;
  shopifyOrderId: string;
  orderNumber: string;
  customerName: string | null;
  phoneMasked: string | null;
  riskLevel: RiskLevel;
  deliveryRateAtOrderTime: number | null;
  outcome: OrderOutcome;
  orderTotal: number | null;
  currency: string | null;
  shopifyFinancialStatus: string | null;
  shopifyFulfillmentStatus: string | null;
  shopifyCreatedAt: string | null;
}

export interface OrdersFilter {
  page: number;
  limit: number;
  riskLevel?: RiskLevel;
  outcome?: OrderOutcome;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
